'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trophy, Upload, Check } from 'lucide-react'
import { Winning } from '@/types'

export default function WinningsPage() {
  const [winnings, setWinnings] = useState<Winning[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeWinning, setActiveWinning] = useState<string | null>(null)
  const supabase = createClient()

  const fetchWinnings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('winnings')
      .select('*, draw:draws(draw_date)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setWinnings(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchWinnings() }, [])

  const handleProofUpload = async (winningId: string, file: File) => {
    setUploadingId(winningId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const filePath = `proofs/${user.id}/${winningId}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploadingId(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(filePath)

    await supabase
      .from('winnings')
      .update({ status: 'proof_uploaded', proof_url: publicUrl })
      .eq('id', winningId)

    setUploadSuccess(winningId)
    fetchWinnings()
    setUploadingId(null)
    setActiveWinning(null)
  }

  const totalEarned = winnings.filter((w: any) => w.status === 'paid').reduce((s, w) => s + w.amount, 0)
  const pendingAmount = winnings.filter((w: any) => ['pending', 'proof_uploaded', 'verified'].includes(w.status)).reduce((s, w) => s + w.amount, 0)

  const matchLabel = (type: string) => type.replace('_match', ' Match').replace('5', 'Jackpot (5')  + (type === '5_match' ? ')' : '')

  const badgeVariant = (status: string) => {
    if (status === 'paid') return 'success' as const
    if (status === 'rejected') return 'danger' as const
    if (status === 'verified') return 'info' as const
    if (status === 'proof_uploaded') return 'purple' as const
    return 'warning' as const
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Winnings</h1>
        <p className="text-gray-500 mt-1">Track your lottery prizes and upload proof to claim</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="stat-card">
          <div className="text-sm text-gray-500 mb-1">Total Paid Out</div>
          <div className="text-3xl font-bold text-green-600">{formatCurrency(totalEarned)}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500 mb-1">Pending Claims</div>
          <div className="text-3xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Winnings</CardTitle>
          <CardDescription>Upload proof to claim your prizes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-400">Loading...</div>
          ) : winnings.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="h-14 w-14 text-gray-200 mx-auto mb-4" />
              <h3 className="font-medium text-gray-500 mb-1">No winnings yet</h3>
              <p className="text-sm text-gray-400">Keep entering draws — your lucky number is coming!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {winnings.map((winning: any) => (
                <div key={winning.id} className="p-5 border border-gray-100 rounded-xl">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-lg">{formatCurrency(winning.amount)}</span>
                        <Badge variant={badgeVariant(winning.status)}>
                          {winning.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">{matchLabel(winning.match_type)}</div>
                      {winning.draw && (
                        <div className="text-xs text-gray-400 mt-1">Draw: {formatDate(winning.draw.draw_date)}</div>
                      )}
                      {winning.admin_notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                          Note: {winning.admin_notes}
                        </div>
                      )}
                    </div>
                    <div>
                      {winning.status === 'pending' && (
                        <>
                          {activeWinning === winning.id ? (
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                ref={fileInputRef}
                                onChange={e => {
                                  const file = e.target.files?.[0]
                                  if (file) handleProofUpload(winning.id, file)
                                }}
                                className="hidden"
                              />
                              <Button
                                size="sm"
                                loading={uploadingId === winning.id}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="h-3.5 w-3.5" />
                                Choose file
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setActiveWinning(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setActiveWinning(winning.id)}>
                              <Upload className="h-3.5 w-3.5" />
                              Upload Proof
                            </Button>
                          )}
                        </>
                      )}
                      {winning.status === 'proof_uploaded' && (
                        <div className="flex items-center gap-1.5 text-sm text-purple-600 font-medium">
                          <Check className="h-4 w-4" />
                          Proof submitted
                        </div>
                      )}
                      {winning.proof_url && (
                        <a href={winning.proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 block">
                          View proof →
                        </a>
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
