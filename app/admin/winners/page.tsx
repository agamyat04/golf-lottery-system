'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trophy, Check, X, DollarSign, ExternalLink } from 'lucide-react'

export default function AdminWinnersPage() {
  const [winnings, setWinnings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<string>('all')
  const supabase = createClient()

  const fetchWinnings = async () => {
    const { data } = await supabase
      .from('winnings')
      .select('*, draw:draws(draw_date), profile:profiles(full_name, email)')
      .order('created_at', { ascending: false })
    setWinnings(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchWinnings() }, [])

  const updateStatus = async (id: string, status: string) => {
    setProcessingId(id)
    const updateData: any = { status }
    if (noteInput[id]) updateData.admin_notes = noteInput[id]
    await supabase.from('winnings').update(updateData).eq('id', id)
    fetchWinnings()
    setProcessingId(null)
  }

  const filtered = filter === 'all' ? winnings : winnings.filter(w => w.status === filter)

  const matchLabel = (type: string) => {
    if (type === '5_match') return 'Jackpot (5 Match)'
    if (type === '4_match') return '4 Match'
    return '3 Match'
  }

  const badgeVariant = (status: string) => {
    const map: Record<string, any> = {
      paid: 'success', rejected: 'danger', verified: 'info',
      proof_uploaded: 'purple', pending: 'warning'
    }
    return map[status] || 'default'
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Winner Verification</h1>
        <p className="text-gray-500 mt-1">Review proof uploads and approve or reject claims</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'pending', 'proof_uploaded', 'verified', 'paid', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.replace('_', ' ')}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({winnings.filter(w => w.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No winnings found for this filter</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((w: any) => (
                <div key={w.id} className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-gray-900 text-lg">{formatCurrency(w.amount)}</span>
                        <Badge variant={badgeVariant(w.status)}>{w.status.replace('_', ' ')}</Badge>
                        <span className="text-sm text-gray-500">{matchLabel(w.match_type)}</span>
                      </div>
                      <div className="mt-2 space-y-0.5">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{w.profile?.full_name || 'Unknown'}</span>
                          <span className="text-gray-400 ml-2">{w.profile?.email}</span>
                        </div>
                        {w.draw?.draw_date && (
                          <div className="text-xs text-gray-400">Draw: {formatDate(w.draw.draw_date)}</div>
                        )}
                        {w.admin_notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-1.5 mt-2">
                            Note: {w.admin_notes}
                          </div>
                        )}
                      </div>

                      {/* Proof */}
                      {w.proof_url && (
                        <a
                          href={w.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 mt-2 font-medium"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View proof document
                        </a>
                      )}

                      {/* Admin note input for proof_uploaded */}
                      {w.status === 'proof_uploaded' && (
                        <div className="mt-3">
                          <input
                            type="text"
                            placeholder="Add admin note (optional)..."
                            value={noteInput[w.id] || ''}
                            onChange={e => setNoteInput(prev => ({ ...prev, [w.id]: e.target.value }))}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {w.status === 'proof_uploaded' && (
                        <>
                          <Button
                            size="sm"
                            loading={processingId === w.id}
                            onClick={() => updateStatus(w.id, 'verified')}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={processingId === w.id}
                            onClick={() => updateStatus(w.id, 'rejected')}
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                      {w.status === 'verified' && (
                        <Button
                          size="sm"
                          loading={processingId === w.id}
                          onClick={() => updateStatus(w.id, 'paid')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          Mark as Paid
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
  )
}
