'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Ticket, Trophy } from 'lucide-react'

export default function DrawsPage() {
  const [draws, setDraws] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const uid = session.user.id

      const [drawsRes, entriesRes, subRes] = await Promise.all([
        supabase.from('draws').select('*').order('draw_date', { ascending: false }).limit(10),
        supabase.from('draw_entries').select('*, draw:draws(*)').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*').eq('user_id', uid).eq('status', 'active').maybeSingle(),
      ])

      setDraws(drawsRes.data || [])
      setEntries(entriesRes.data || [])
      setSubscription(subRes.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const myEntryIds = new Set(entries.map((e: any) => e.draw_id))

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Monthly Draws</h1>
        <p className="text-gray-500 mt-1">View draw history and your participation. Active subscribers are automatically enrolled.</p>
      </div>

      {!subscription && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <p className="text-amber-800 font-medium">⚠️ You need an active subscription to participate in draws.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Jackpot (5 Match)', pct: '40%', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: '4 Match', pct: '35%', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
          { label: '3 Match', pct: '25%', color: 'bg-green-50 border-green-200 text-green-700' },
        ].map(tier => (
          <div key={tier.label} className={`rounded-xl border p-4 text-center ${tier.color}`}>
            <div className="text-2xl font-bold">{tier.pct}</div>
            <div className="text-sm font-medium mt-1">{tier.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Draw History</CardTitle>
            <CardDescription>Your participation across all draws</CardDescription>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="py-10 text-center">
                <Ticket className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No draw entries yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry: any) => (
                  <div key={entry.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-gray-900">{entry.draw && formatDate(entry.draw.draw_date)}</div>
                        <div className="text-xs text-gray-400">{entry.draw?.status}</div>
                      </div>
                      <Badge variant={entry.matches >= 5 ? 'warning' : entry.matches >= 4 ? 'info' : entry.matches >= 3 ? 'success' : 'default'}>
                        {entry.matches} match{entry.matches !== 1 ? 'es' : ''}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {entry.numbers.map((n: number) => (
                        <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          entry.draw?.drawn_numbers?.includes(n) ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
                        }`}>{n}</div>
                      ))}
                    </div>
                    {entry.draw?.drawn_numbers?.length > 0 && (
                      <div className="mt-2 text-xs text-gray-400">Drawn: {entry.draw.drawn_numbers.join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Draws</CardTitle>
            <CardDescription>Complete draw history</CardDescription>
          </CardHeader>
          <CardContent>
            {draws.length === 0 ? (
              <div className="py-10 text-center">
                <Trophy className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No draws yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {draws.map((draw: any) => (
                  <div key={draw.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-gray-900">{formatDate(draw.draw_date)}</div>
                      <div className="text-sm text-gray-400">{formatCurrency(draw.prize_pool)} pool</div>
                      {draw.drawn_numbers?.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {draw.drawn_numbers.map((n: number) => (
                            <div key={n} className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{n}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(draw.status)}`}>{draw.status}</span>
                      {myEntryIds.has(draw.id) && <div className="text-xs text-indigo-600 font-medium mt-1">✓ Entered</div>}
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
