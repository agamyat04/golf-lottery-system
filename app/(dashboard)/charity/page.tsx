'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Heart, ExternalLink, Check } from 'lucide-react'
import { Charity, Contribution } from '@/types'

export default function CharityPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [contribution, setContribution] = useState<Contribution | null>(null)
  const [selectedCharity, setSelectedCharity] = useState<string>('')
  const [percentage, setPercentage] = useState('10')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [charitiesRes, contributionRes] = await Promise.all([
        supabase.from('charities').select('*').eq('is_active', true).order('name'),
        supabase.from('contributions').select('*, charity:charities(*)').eq('user_id', user.id).maybeSingle(),
      ])

      setCharities(charitiesRes.data || [])
      if (contributionRes.data) {
        setContribution(contributionRes.data)
        setSelectedCharity(contributionRes.data.charity_id)
        setPercentage(contributionRes.data.percentage.toString())
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const saveContribution = async () => {
    if (!selectedCharity) {
      setError('Please select a charity')
      return
    }
    const pct = parseFloat(percentage)
    if (isNaN(pct) || pct < 10 || pct > 100) {
      setError('Contribution must be between 10% and 100%')
      return
    }

    setError('')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      charity_id: selectedCharity,
      percentage: pct,
    }

    let err
    if (contribution) {
      const res = await supabase.from('contributions').update(payload).eq('id', contribution.id)
      err = res.error
    } else {
      const res = await supabase.from('contributions').insert(payload)
      err = res.error
    }

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Charity contribution saved!')
      const updatedRes = await supabase.from('contributions').select('*, charity:charities(*)').eq('user_id', user.id).maybeSingle()
      if (updatedRes.data) setContribution(updatedRes.data)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Charity Contributions</h1>
        <p className="text-gray-500 mt-1">Choose your charity and set your contribution percentage (minimum 10%)</p>
      </div>

      {/* Current selection */}
      {contribution?.charity && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Heart className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-green-700 font-medium">Currently supporting</p>
            <p className="font-bold text-green-900">{(contribution.charity as any).name} — {contribution.percentage}%</p>
          </div>
          <Badge variant="success" className="ml-auto">Active</Badge>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Your Contribution</CardTitle>
            <CardDescription>Set your charity and percentage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Selected Charity
              </label>
              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                {selectedCharity
                  ? charities.find(c => c.id === selectedCharity)?.name || 'Loading...'
                  : 'None selected — choose from the list'}
              </div>
            </div>

            <Input
              id="percentage"
              label="Contribution Percentage"
              type="number"
              min="10"
              max="100"
              value={percentage}
              onChange={e => setPercentage(e.target.value)}
              hint="Minimum 10% required"
            />

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{success}</p>}

            <Button onClick={saveContribution} loading={saving} className="w-full">
              <Check className="h-4 w-4" />
              Save Contribution
            </Button>
          </CardContent>
        </Card>

        {/* Charity List */}
        <div className="lg:col-span-2 space-y-4">
          {charities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No charities available yet</p>
              </CardContent>
            </Card>
          ) : (
            charities.map(charity => (
              <Card
                key={charity.id}
                hover
                className={`cursor-pointer transition-all ${selectedCharity === charity.id ? 'ring-2 ring-indigo-600 border-indigo-200' : ''}`}
                onClick={() => setSelectedCharity(charity.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Heart className="h-6 w-6 text-rose-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{charity.name}</h3>
                        {charity.description && (
                          <p className="text-sm text-gray-500 mt-1">{charity.description}</p>
                        )}
                        {charity.website && (
                          <a
                            href={charity.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 mt-2 hover:text-indigo-700"
                            onClick={e => e.stopPropagation()}
                          >
                            Visit website <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    {selectedCharity === charity.id && (
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
