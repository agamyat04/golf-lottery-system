'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Ticket, Play, AlertTriangle } from 'lucide-react'

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [newDrawDate, setNewDrawDate] = useState('')
  const [newPrizePool, setNewPrizePool] = useState('1000')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const fetchDraws = async () => {
    const { data } = await supabase
      .from('draws')
      .select('*')
      .order('draw_date', { ascending: false })
    setDraws(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchDraws() }, [])

  const createDraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setMessage('')

    const { error } = await supabase.from('draws').insert({
      draw_date: newDrawDate,
      drawn_numbers: [],
      prize_pool: parseFloat(newPrizePool),
      jackpot_amount: parseFloat(newPrizePool) * 0.40,
      four_match_amount: parseFloat(newPrizePool) * 0.35,
      three_match_amount: parseFloat(newPrizePool) * 0.25,
      rollover_amount: 0,
      status: 'pending',
    })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Draw created successfully!')
      setNewDrawDate('')
      fetchDraws()
    }
    setCreating(false)
  }

  const runDraw = async (drawId: string) => {
    if (!confirm('Run this draw now? This will generate winning numbers and match all entries. This cannot be undone.')) return

    setRunning(true)
    setMessage('')

    try {
      const res = await fetch('/api/draws/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId }),
      })
      const data = await res.json()

      if (data.success) {
        setMessage(`Draw completed! ${data.winners} winner(s) found.`)
        fetchDraws()
      } else {
        setMessage('Error: ' + data.error)
      }
    } catch {
      setMessage('Network error')
    }

    setRunning(false)
  }

  const statusVariant = (status: string) => {
    if (status === 'completed') return 'success' as const
    if (status === 'running') return 'info' as const
    return 'warning' as const
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Draw Management</h1>
        <p className="text-gray-500 mt-1">Create and run monthly lottery draws</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
          message.includes('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Create Draw */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Draw</CardTitle>
            <CardDescription>Schedule a new monthly draw</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createDraw} className="space-y-4">
              <Input
                id="drawDate"
                label="Draw Date"
                type="date"
                value={newDrawDate}
                onChange={e => setNewDrawDate(e.target.value)}
                required
              />
              <Input
                id="prizePool"
                label="Prize Pool (£)"
                type="number"
                min="0"
                step="0.01"
                value={newPrizePool}
                onChange={e => setNewPrizePool(e.target.value)}
                required
              />
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                <div>Jackpot (40%): {formatCurrency(parseFloat(newPrizePool || '0') * 0.40)}</div>
                <div>4 Match (35%): {formatCurrency(parseFloat(newPrizePool || '0') * 0.35)}</div>
                <div>3 Match (25%): {formatCurrency(parseFloat(newPrizePool || '0') * 0.25)}</div>
              </div>
              <Button type="submit" loading={creating} className="w-full">
                Create Draw
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Draw List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Draws</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-gray-400">Loading...</div>
              ) : draws.length === 0 ? (
                <div className="py-12 text-center">
                  <Ticket className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">No draws created yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {draws.map(draw => (
                    <div key={draw.id} className="p-5 border border-gray-100 rounded-xl">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="font-semibold text-gray-900">{formatDate(draw.draw_date)}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Pool: {formatCurrency(draw.prize_pool)}
                            {draw.rollover_amount > 0 && ` + ${formatCurrency(draw.rollover_amount)} rollover`}
                          </div>
                          {draw.drawn_numbers?.length > 0 && (
                            <div className="flex gap-1.5 mt-2">
                              {draw.drawn_numbers.map((n: number) => (
                                <div key={n} className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                  {n}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={statusVariant(draw.status)}>{draw.status}</Badge>
                          {draw.status === 'pending' && (
                            <Button
                              size="sm"
                              loading={running}
                              onClick={() => runDraw(draw.id)}
                            >
                              <Play className="h-3.5 w-3.5" />
                              Run Draw
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
