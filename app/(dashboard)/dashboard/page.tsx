'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CreditCard, Flag, Ticket, Trophy, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const uid = session.user.id

      const [profileRes, subscriptionRes, scoresRes, winningsRes, upcomingDrawRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).single(),
        supabase.from('subscriptions').select('*').eq('user_id', uid).eq('status', 'active').maybeSingle(),
        supabase.from('scores').select('*').eq('user_id', uid).order('score_date', { ascending: false }).limit(5),
        supabase.from('winnings').select('*, draw:draws(draw_date)').eq('user_id', uid).order('created_at', { ascending: false }).limit(3),
        supabase.from('draws').select('*').eq('status', 'pending').order('draw_date', { ascending: true }).limit(1),
      ])

      setData({
        profile: profileRes.data,
        subscription: subscriptionRes.data,
        scores: scoresRes.data || [],
        winnings: winningsRes.data || [],
        upcomingDraw: upcomingDrawRes.data?.[0],
      })
      setLoading(false)
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    )
  }

  if (!data) return null

  const { profile, subscription, scores, winnings, upcomingDraw } = data
  const totalWinnings = winnings.reduce((sum: number, w: any) => sum + w.amount, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your account</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Subscription</span>
          </div>
          <div className="text-xl font-bold text-gray-900 capitalize">
            {subscription ? subscription.plan : 'None'}
          </div>
          <Badge variant={subscription ? 'success' : 'warning'} className="mt-1">
            {subscription ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Flag className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Scores</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{scores.length}<span className="text-base text-gray-400">/5</span></div>
          <div className="text-xs text-gray-400 mt-1">Tracked</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Ticket className="h-4 w-4 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Next Draw</span>
          </div>
          <div className="text-sm font-bold text-gray-900">
            {upcomingDraw ? formatDate(upcomingDraw.draw_date) : 'TBD'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {upcomingDraw ? formatCurrency(upcomingDraw.prize_pool) + ' pool' : 'No draw scheduled'}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Trophy className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Winnings</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalWinnings)}</div>
          <div className="text-xs text-gray-400 mt-1">Total earned</div>
        </div>
      </div>

      {!subscription && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-indigo-900">No active subscription</h3>
            <p className="text-sm text-indigo-700 mt-0.5">Subscribe to start participating in monthly draws</p>
          </div>
          <Link href="/subscription" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Subscribe now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Scores</CardTitle>
            <Link href="/scores" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {scores.length === 0 ? (
              <div className="text-center py-8">
                <Flag className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No scores recorded yet</p>
                <Link href="/scores" className="text-sm text-indigo-600 font-medium mt-2 inline-block">Add your first score</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {scores.map((score: any) => (
                  <div key={score.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="text-sm font-medium text-gray-900">{formatDate(score.score_date)}</div>
                    <div className="text-xl font-bold text-indigo-600">{score.score}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Winnings</CardTitle>
            <Link href="/winnings" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {winnings.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No winnings yet — keep playing!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {winnings.map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{w.match_type?.replace('_', ' ')}</div>
                      <div className="text-xs text-gray-400">{w.draw && formatDate(w.draw.draw_date)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatCurrency(w.amount)}</div>
                      <Badge variant={w.status === 'paid' ? 'success' : w.status === 'rejected' ? 'danger' : 'warning'}>
                        {w.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
