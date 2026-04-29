export type UserRole = 'user' | 'admin'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trialing'
export type SubscriptionPlan = 'monthly' | 'yearly'
export type DrawStatus = 'pending' | 'running' | 'completed'
export type WinningStatus = 'pending' | 'proof_uploaded' | 'verified' | 'paid' | 'rejected'
export type MatchType = '5_match' | '4_match' | '3_match'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface Charity {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  is_active: boolean
  created_at: string
}

export interface Contribution {
  id: string
  user_id: string
  charity_id: string
  percentage: number
  created_at: string
  updated_at: string
  charity?: Charity
}

export interface Score {
  id: string
  user_id: string
  score: number
  score_date: string
  created_at: string
}

export interface Draw {
  id: string
  draw_date: string
  drawn_numbers: number[]
  prize_pool: number
  jackpot_amount: number
  four_match_amount: number
  three_match_amount: number
  rollover_amount: number
  status: DrawStatus
  created_at: string
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  numbers: number[]
  matches: number
  created_at: string
  draw?: Draw
  profile?: Profile
}

export interface Winning {
  id: string
  user_id: string
  draw_id: string
  draw_entry_id: string
  amount: number
  match_type: MatchType
  status: WinningStatus
  proof_url: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  draw?: Draw
  profile?: Profile
}

export interface DashboardStats {
  totalUsers: number
  activeSubscriptions: number
  totalDraws: number
  totalPrizePool: number
}
