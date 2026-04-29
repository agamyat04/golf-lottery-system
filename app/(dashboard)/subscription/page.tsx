'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PLANS } from '@/lib/stripe'
import { Check, CreditCard, Zap } from 'lucide-react'
import { Subscription } from '@/types'

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchSub = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()

      setSubscription(data)
      setLoading(false)
    }
    fetchSub()

    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === '1') setMessage('🎉 Subscription activated successfully!')
    if (params.get('cancelled') === '1') setMessage('Checkout was cancelled.')
  }, [])

  const handleCheckout = async (plan: 'monthly' | 'yearly') => {
    setCheckingOut(plan)
    setMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setMessage('Not logged in'); setCheckingOut(null); return }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.mock) {
        // Mock mode
        await supabase.from('subscriptions').upsert({
          user_id: session.user.id,
          plan,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'user_id' })

        setMessage('✅ Subscription activated (mock mode)!')
        const { data: newSub } = await supabase.from('subscriptions').select('*').eq('user_id', session.user.id).maybeSingle()
        setSubscription(newSub)
      } else {
        setMessage(data.error || 'Something went wrong')
      }
    } catch (err) {
      setMessage('Network error — please try again')
    }

    setCheckingOut(null)
  }

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription?')) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', session.user.id)
    setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null)
    setMessage('Subscription cancelled.')
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your GolfDraw subscription</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
          message.includes('✅') || message.includes('🎉')
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>{message}</div>
      )}

      {subscription && (
        <Card className="mb-8">
          <CardHeader><CardTitle>Current Plan</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 capitalize text-lg">{subscription.plan} Plan</div>
                  <div className="text-sm text-gray-500">
                    {subscription.current_period_end && `Renews ${formatDate(subscription.current_period_end)}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isActive ? 'success' : 'danger'}>{subscription.status}</Badge>
                {isActive && <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isActive && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Plan</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {(['monthly', 'yearly'] as const).map(planKey => {
              const plan = PLANS[planKey]
              const isYearly = planKey === 'yearly'
              return (
                <div key={planKey} className={`rounded-2xl border-2 p-8 ${isYearly ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                  {isYearly && (
                    <div className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                      <Zap className="h-3 w-3" />BEST VALUE — 2 months free
                    </div>
                  )}
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatCurrency(plan.price)}<span className="text-base font-normal text-gray-500">/{planKey === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  <div className="font-semibold text-gray-900 mb-4">{plan.name}</div>
                  <div className="space-y-2 mb-6">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />{f}
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" loading={checkingOut === planKey} onClick={() => handleCheckout(planKey)} size="lg">
                    Get started
                  </Button>
                </div>
              )
            })}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">Payments processed securely via Stripe. Cancel anytime.</p>
        </div>
      )}
    </div>
  )
}