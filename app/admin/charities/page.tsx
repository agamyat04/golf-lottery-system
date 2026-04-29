'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Heart, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Charity } from '@/types'

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', website: '' })
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const fetchCharities = async () => {
    const { data } = await supabase.from('charities').select('*').order('name')
    setCharities(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCharities() }, [])

  const createCharity = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    const { error } = await supabase.from('charities').insert({
      name: form.name,
      description: form.description || null,
      website: form.website || null,
      is_active: true,
    })
    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Charity added!')
      setForm({ name: '', description: '', website: '' })
      setShowForm(false)
      fetchCharities()
    }
    setCreating(false)
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('charities').update({ is_active: !current }).eq('id', id)
    fetchCharities()
  }

  const deleteCharity = async (id: string) => {
    if (!confirm('Delete this charity? Users who selected it will lose their selection.')) return
    await supabase.from('charities').delete().eq('id', id)
    fetchCharities()
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Charities</h1>
          <p className="text-gray-500 mt-1">Manage charity options for users</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Charity
        </Button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Charity</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCharity} className="space-y-4">
              <Input
                id="name"
                label="Charity Name"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the charity..."
                />
              </div>
              <Input
                id="website"
                label="Website URL (optional)"
                type="url"
                value={form.website}
                onChange={e => setForm(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://..."
              />
              <div className="flex gap-3">
                <Button type="submit" loading={creating}>Add Charity</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-gray-400">Loading...</div>
          ) : charities.length === 0 ? (
            <div className="py-16 text-center">
              <Heart className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No charities yet. Add one above.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {charities.map(charity => (
                <div key={charity.id} className="flex items-center justify-between gap-4 px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Heart className="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{charity.name}</div>
                      {charity.description && (
                        <div className="text-sm text-gray-400 mt-0.5">{charity.description}</div>
                      )}
                      {charity.website && (
                        <a href={charity.website} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-700">
                          {charity.website}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={charity.is_active ? 'success' : 'default'}>
                      {charity.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <button
                      onClick={() => toggleActive(charity.id, charity.is_active)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Toggle active"
                    >
                      {charity.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => deleteCharity(charity.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
