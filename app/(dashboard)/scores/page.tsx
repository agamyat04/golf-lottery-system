'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { Flag, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Score } from '@/types'

export default function ScoresPage() {
  const [scores, setScores] = useState<Score[]>([])
  const [newScore, setNewScore] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  const fetchScores = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('score_date', { ascending: false })

    setScores(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchScores() }, [])

  const addScore = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setAdding(true)

    const scoreNum = parseInt(newScore)
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 200) {
      setError('Please enter a valid score between 1 and 200')
      setAdding(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check duplicate date
    const existing = scores.find(s => s.score_date === newDate)
    if (existing) {
      setError('You already have a score for this date')
      setAdding(false)
      return
    }

    // If 5 scores already, delete oldest
    if (scores.length >= 5) {
      const oldest = scores[scores.length - 1]
      await supabase.from('scores').delete().eq('id', oldest.id)
    }

    const { error } = await supabase.from('scores').insert({
      user_id: user.id,
      score: scoreNum,
      score_date: newDate,
    })

    if (error) {
      if (error.code === '23505') {
        setError('You already have a score for this date')
      } else {
        setError(error.message)
      }
    } else {
      setSuccess('Score added successfully!')
      setNewScore('')
      setNewDate(new Date().toISOString().split('T')[0])
      fetchScores()
    }

    setAdding(false)
  }

  const deleteScore = async (id: string) => {
    await supabase.from('scores').delete().eq('id', id)
    setScores(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Golf Scores</h1>
        <p className="text-gray-500 mt-1">Track your last 5 scores. Oldest score is replaced automatically when you reach the limit.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Add Score Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Score</CardTitle>
            <CardDescription>Enter your golf score for a specific date</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addScore} className="space-y-4">
              <Input
                id="score"
                label="Score"
                type="number"
                placeholder="72"
                min="1"
                max="200"
                value={newScore}
                onChange={e => setNewScore(e.target.value)}
                required
              />
              <Input
                id="date"
                label="Date"
                type="date"
                value={newDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setNewDate(e.target.value)}
                required
              />

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  {success}
                </div>
              )}

              <Button type="submit" loading={adding} className="w-full">
                <Plus className="h-4 w-4" />
                Add Score
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Scores List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Scores</CardTitle>
                <CardDescription>
                  {scores.length}/5 scores tracked
                  {scores.length >= 5 && ' — Next addition replaces oldest'}
                </CardDescription>
              </div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i <= scores.length ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-gray-400">Loading...</div>
              ) : scores.length === 0 ? (
                <div className="py-12 text-center">
                  <Flag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No scores yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add your first golf score using the form</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scores.map((score, idx) => (
                    <div key={score.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-200">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{formatDate(score.score_date)}</div>
                          {idx === scores.length - 1 && scores.length === 5 && (
                            <Badge variant="warning" className="mt-0.5 text-xs">Oldest — will be replaced</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-indigo-600">{score.score}</div>
                        <button
                          onClick={() => deleteScore(score.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
      </div>
    </div>
  )
}
