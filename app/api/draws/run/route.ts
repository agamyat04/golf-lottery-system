import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateLotteryNumbers, countMatches } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { drawId } = await req.json()

    if (!drawId) {
      return NextResponse.json({ error: 'drawId required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get draw
    const { data: draw, error: drawErr } = await admin
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single()

    if (drawErr || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 })
    }

    if (draw.status !== 'pending') {
      return NextResponse.json({ error: 'Draw already completed or running' }, { status: 400 })
    }

    // Mark as running
    await admin.from('draws').update({ status: 'running' }).eq('id', drawId)

    // Generate winning numbers
    const drawnNumbers = generateLotteryNumbers()

    // Get all subscribers with active subscriptions
    const { data: subscribers } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')

    if (!subscribers || subscribers.length === 0) {
      await admin.from('draws').update({
        status: 'completed',
        drawn_numbers: drawnNumbers,
      }).eq('id', drawId)
      return NextResponse.json({ success: true, drawnNumbers, winners: 0, message: 'No active subscribers' })
    }

    // Generate entries for each subscriber (use their scores as lucky numbers, fill remainder randomly)
    const entriesCreated: any[] = []

    for (const sub of subscribers) {
      // Get user scores for number generation
      const { data: scores } = await admin
        .from('scores')
        .select('score')
        .eq('user_id', sub.user_id)
        .order('score_date', { ascending: false })
        .limit(5)

      // Build numbers: use score values mod 49 + 1 as base, then fill randomly
      const baseNumbers: number[] = []
      if (scores && scores.length > 0) {
        for (const s of scores) {
          const n = (s.score % 49) + 1
          if (!baseNumbers.includes(n)) baseNumbers.push(n)
        }
      }

      // Fill rest randomly to get 5 unique numbers
      while (baseNumbers.length < 5) {
        const n = Math.floor(Math.random() * 49) + 1
        if (!baseNumbers.includes(n)) baseNumbers.push(n)
      }

      const userNumbers = baseNumbers.slice(0, 5).sort((a, b) => a - b)
      const matches = countMatches(userNumbers, drawnNumbers)

      // Check for existing entry
      const { data: existingEntry } = await admin
        .from('draw_entries')
        .select('id')
        .eq('draw_id', drawId)
        .eq('user_id', sub.user_id)
        .maybeSingle()

      if (!existingEntry) {
        const { data: entry } = await admin.from('draw_entries').insert({
          draw_id: drawId,
          user_id: sub.user_id,
          numbers: userNumbers,
          matches,
        }).select().single()

        if (entry) entriesCreated.push({ ...entry, matches })
      }
    }

    // Calculate prizes
    const prizePool = draw.prize_pool + (draw.rollover_amount || 0)
    const jackpotAmount = prizePool * 0.40
    const fourMatchAmount = prizePool * 0.35
    const threeMatchAmount = prizePool * 0.25

    const jackpotWinners = entriesCreated.filter(e => e.matches === 5)
    const fourMatchWinners = entriesCreated.filter(e => e.matches === 4)
    const threeMatchWinners = entriesCreated.filter(e => e.matches === 3)

    let rollover = 0
    let totalWinners = 0

    // Create winnings records
    const winningsToInsert: any[] = []

    // Jackpot
    if (jackpotWinners.length > 0) {
      const perWinner = jackpotAmount / jackpotWinners.length
      jackpotWinners.forEach(e => {
        winningsToInsert.push({
          user_id: e.user_id,
          draw_id: drawId,
          draw_entry_id: e.id,
          amount: perWinner,
          match_type: '5_match',
          status: 'pending',
        })
      })
      totalWinners += jackpotWinners.length
    } else {
      rollover += jackpotAmount
    }

    // 4 Match
    if (fourMatchWinners.length > 0) {
      const perWinner = fourMatchAmount / fourMatchWinners.length
      fourMatchWinners.forEach(e => {
        winningsToInsert.push({
          user_id: e.user_id,
          draw_id: drawId,
          draw_entry_id: e.id,
          amount: perWinner,
          match_type: '4_match',
          status: 'pending',
        })
      })
      totalWinners += fourMatchWinners.length
    }

    // 3 Match
    if (threeMatchWinners.length > 0) {
      const perWinner = threeMatchAmount / threeMatchWinners.length
      threeMatchWinners.forEach(e => {
        winningsToInsert.push({
          user_id: e.user_id,
          draw_id: drawId,
          draw_entry_id: e.id,
          amount: perWinner,
          match_type: '3_match',
          status: 'pending',
        })
      })
      totalWinners += threeMatchWinners.length
    }

    if (winningsToInsert.length > 0) {
      await admin.from('winnings').insert(winningsToInsert)
    }

    // Update draw as completed
    await admin.from('draws').update({
      status: 'completed',
      drawn_numbers: drawnNumbers,
      rollover_amount: rollover,
      jackpot_amount: jackpotAmount,
      four_match_amount: fourMatchAmount,
      three_match_amount: threeMatchAmount,
    }).eq('id', drawId)

    return NextResponse.json({
      success: true,
      drawnNumbers,
      winners: totalWinners,
      entriesProcessed: entriesCreated.length,
      rollover,
    })
  } catch (error: any) {
    console.error('Draw run error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
