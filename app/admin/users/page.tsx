'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { Users } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, subscriptions(plan, status), contributions(percentage, charity:charities(name))')
        .order('created_at', { ascending: false })
      setUsers(data || [])
      setLoading(false)
    }
    fetchUsers()
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">{users.length} total users</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-gray-400">Loading...</div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center"><Users className="h-12 w-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-400">No users yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['User', 'Role', 'Subscription', 'Charity', 'Joined'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user: any) => {
                    const activeSub = user.subscriptions?.find((s: any) => s.status === 'active')
                    const contribution = user.contributions?.[0]
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{user.full_name || 'No name'}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </td>
                        <td className="px-6 py-4"><Badge variant={user.role === 'admin' ? 'purple' : 'default'}>{user.role}</Badge></td>
                        <td className="px-6 py-4">{activeSub ? <Badge variant="success" className="capitalize">{activeSub.plan}</Badge> : <Badge variant="warning">None</Badge>}</td>
                        <td className="px-6 py-4">
                          {contribution ? (
                            <div><div className="text-sm font-medium text-gray-900">{contribution.charity?.name}</div><div className="text-xs text-gray-400">{contribution.percentage}%</div></div>
                          ) : <span className="text-gray-400 text-sm">None</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{formatDate(user.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
