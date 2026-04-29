'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Users, CreditCard, Ticket, Trophy, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, subsRes, drawsRes, winningsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('draws').select('id, prize_pool, status'),
        supabase.from('winnings').select('amount, status'),
      ])
      setStats({
        totalUsers: usersRes.count || 0,
        activeSubs: subsRes.count || 0,
        draws: drawsRes.data || [],
        winnings: winningsRes.data || [],
      })
    }
    fetchStats()
  }, [])

  if (!stats) return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>

  const totalPrizePool = stats.draws.reduce((s: number, d: any) => s + (d.prize_pool || 0), 0)
  const pendingVerifications = stats.winnings.filter((w: any) => w.status === 'proof_uploaded').length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 mt-1">Platform statistics and quick actions</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Active Subscriptions', value: stats.activeSubs, icon: CreditCard, color: 'bg-green-50 text-green-600' },
          { label: 'Total Draws', value: stats.draws.length, icon: Ticket, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Pending Verifications', value: pendingVerifications, icon: Trophy, color: 'bg-red-50 text-red-600' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Financial Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-600">Total Prize Pool</span>
                <span className="font-bold text-gray-900">{formatCurrency(totalPrizePool)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-600">Total Winnings Claimed</span>
                <span className="font-bold text-gray-900">{formatCurrency(stats.winnings.filter((w: any) => w.status === 'paid').reduce((s: number, w: any) => s + w.amount, 0))}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Pending Payouts</span>
                <span className="font-bold text-yellow-600">{formatCurrency(stats.winnings.filter((w: any) => w.status === 'verified').reduce((s: number, w: any) => s + w.amount, 0))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { href: '/admin/draws', label: 'Run Monthly Draw', desc: 'Create and execute new draw' },
                { href: '/admin/winners', label: 'Verify Winners', desc: `${pendingVerifications} awaiting review` },
                { href: '/admin/charities', label: 'Manage Charities', desc: 'Add or edit charities' },
                { href: '/admin/users', label: 'Manage Users', desc: 'View and manage user accounts' },
              ].map(action => (
                <Link key={action.href} href={action.href} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group">
                  <div>
                    <div className="font-medium text-gray-900">{action.label}</div>
                    <div className="text-sm text-gray-400">{action.desc}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
