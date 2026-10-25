/* ─── Database Types for Our Little Goals ─── */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
        Relationships: []
      }
      couples: {
        Row: Couple
        Insert: Partial<Couple> & { name: string; invite_code: string }
        Update: Partial<Couple>
        Relationships: []
      }
      couple_members: {
        Row: CoupleMember
        Insert: Partial<CoupleMember> & { couple_id: string; user_id: string; role: 'partner' | 'treasurer' }
        Update: Partial<CoupleMember>
        Relationships: []
      }
      savings_goals: {
        Row: SavingsGoal
        Insert: Partial<SavingsGoal> & { couple_id: string; created_by: string; name: string; target_amount: number }
        Update: Partial<SavingsGoal>
        Relationships: []
      }
      savings_contributions: {
        Row: SavingsContribution
        Insert: Partial<SavingsContribution> & { goal_id: string; couple_id: string; user_id: string; amount: number }
        Update: Partial<SavingsContribution>
        Relationships: []
      }
      personal_wishlists: {
        Row: PersonalWishlist
        Insert: Partial<PersonalWishlist> & { user_id: string; name: string; target_amount: number }
        Update: Partial<PersonalWishlist>
        Relationships: []
      }
      personal_savings: {
        Row: PersonalSaving
        Insert: Partial<PersonalSaving> & { wishlist_id: string; user_id: string; amount: number }
        Update: Partial<PersonalSaving>
        Relationships: []
      }
      expense_requests: {
        Row: ExpenseRequest
        Insert: Partial<ExpenseRequest> & { couple_id: string; requested_by: string; amount: number; reason: string }
        Update: Partial<ExpenseRequest>
        Relationships: []
      }
      notifications: {
        Row: Notification
        Insert: Partial<Notification> & { user_id: string; type: NotificationType; title: string; message: string }
        Update: Partial<Notification>
        Relationships: []
      }
      notification_preferences: {
        Row: NotificationPreference
        Insert: Partial<NotificationPreference> & { user_id: string }
        Update: Partial<NotificationPreference>
        Relationships: []
      }
      daily_saving_activity: {
        Row: DailySavingActivity
        Insert: Partial<DailySavingActivity> & { user_id: string; date: string }
        Update: Partial<DailySavingActivity>
        Relationships: []
      }
      audit_logs: {
        Row: AuditLog
        Insert: Partial<AuditLog> & { user_id: string; action: string; entity_type: string; entity_id: string }
        Update: Partial<AuditLog>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

/* ─── Entity Types ─── */

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  is_treasurer: boolean
  created_at: string
  updated_at: string
}

export interface Couple {
  id: string
  name: string
  invite_code: string
  treasurer_id: string | null
  created_at: string
}

export interface CoupleMember {
  id: string
  couple_id: string
  user_id: string
  role: 'partner' | 'treasurer'
  joined_at: string
}

export type GoalCategory =
  | 'liburan'
  | 'kuliner'
  | 'hadiah'
  | 'anniversary'
  | 'transportasi'
  | 'hiburan'
  | 'lainnya'

export type GoalStatus = 'active' | 'achieved' | 'archived'

export interface SavingsGoal {
  id: string
  couple_id: string
  created_by: string
  name: string
  description: string | null
  category: GoalCategory
  destination: string | null
  city: string | null
  photo_url: string | null
  min_estimate: number
  max_estimate: number
  target_amount: number
  current_amount: number
  start_date: string
  deadline: string
  notes: string | null
  status: GoalStatus
  created_at: string
  updated_at: string
}

export type ContributionStatus = 'planned' | 'pending' | 'verified' | 'rejected'

export interface SavingsContribution {
  id: string
  goal_id: string
  couple_id: string
  user_id: string
  amount: number
  status: ContributionStatus
  notes: string | null
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  created_at: string
}

export type WishlistPriority = 'rendah' | 'sedang' | 'tinggi'
export type WishlistVisibility = 'private' | 'shared'
export type WishlistStatus = 'active' | 'achieved' | 'archived'

export interface PersonalWishlist {
  id: string
  user_id: string
  name: string
  description: string | null
  photo_url: string | null
  category: string
  min_estimate: number
  max_estimate: number
  target_amount: number
  current_amount: number
  deadline: string | null
  priority: WishlistPriority
  visibility: WishlistVisibility
  notes: string | null
  status: WishlistStatus
  created_at: string
  updated_at: string
}

export interface PersonalSaving {
  id: string
  wishlist_id: string
  user_id: string
  amount: number
  notes: string | null
  created_at: string
}

export type ExpenseStatus = 'pending' | 'approved' | 'rejected'

export interface ExpenseRequest {
  id: string
  couple_id: string
  requested_by: string
  goal_id: string | null
  amount: number
  reason: string
  notes: string | null
  status: ExpenseStatus
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export type NotificationType =
  | 'contribution_new'
  | 'contribution_verified'
  | 'contribution_rejected'
  | 'goal_near_complete'
  | 'goal_achieved'
  | 'expense_request'
  | 'expense_approved'
  | 'expense_rejected'
  | 'daily_reminder'
  | 'goal_updated'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  reference_id: string | null
  reference_type: string | null
  created_at: string
}

export interface NotificationPreference {
  id: string
  user_id: string
  reminder_enabled: boolean
  reminder_hour: number
  reminder_minute: number
  push_enabled: boolean
  updated_at: string
}

export interface DailySavingActivity {
  id: string
  user_id: string
  date: string
  has_saved: boolean
  total_amount: number
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  details: Record<string, unknown> | null
  created_at: string
}

/* ─── Helper Types ─── */

export interface ContributionWithProfile extends SavingsContribution {
  profiles?: Profile
}

export interface GoalWithContributions extends SavingsGoal {
  savings_contributions?: ContributionWithProfile[]
}

export interface WishlistWithSavings extends PersonalWishlist {
  personal_savings?: PersonalSaving[]
}

export const DEPOSIT_AMOUNTS = [5000, 10000, 15000, 20000] as const
export type DepositAmount = (typeof DEPOSIT_AMOUNTS)[number]

export const GOAL_CATEGORIES: { value: GoalCategory; label: string }[] = [
  { value: 'liburan', label: 'Liburan' },
  { value: 'kuliner', label: 'Kuliner' },
  { value: 'hadiah', label: 'Hadiah' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'transportasi', label: 'Transportasi' },
  { value: 'hiburan', label: 'Hiburan' },
  { value: 'lainnya', label: 'Lainnya' },
]

export const WISHLIST_CATEGORIES = [
  'Elektronik',
  'Fashion',
  'Skincare',
  'Buku',
  'Game',
  'Makanan',
  'Hobi',
  'Lainnya',
]

export const MOTIVATIONAL_QUOTES = [
  'Sedikit demi sedikit, lama-lama menjadi bukit. 🏔️',
  'Yang penting konsisten, bukan besar nominalnya. 💪',
  'Menabung bersama itu lebih menyenangkan. 💕',
  'Setiap rupiah mendekatkan kita ke tujuan. ✨',
  'Kita team, goals kita pasti tercapai! 🎯',
  'Sabar itu kunci, konsisten itu jalan. 🗝️',
  'Tabungan kecil, mimpi besar. 🌟',
  'Berdua lebih ringan, berdua lebih dekat. 🤝',
  'Hari ini menabung, besok menikmati. 🌈',
  'Small savings, big memories. 💖',
]

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getProgress(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(Math.round((current / target) * 100), 100)
}

export function getRemaining(current: number, target: number): number {
  return Math.max(target - current, 0)
}

export function getCategoryEmoji(category: GoalCategory | string): string {
  const emojis: Record<string, string> = {
    liburan: '✈️',
    kuliner: '🍽️',
    hadiah: '🎁',
    anniversary: '💑',
    transportasi: '🚗',
    hiburan: '🎬',
    lainnya: '📌',
  }
  return emojis[category] || '📌'
}

export function getPriorityColor(priority: WishlistPriority): string {
  switch (priority) {
    case 'tinggi': return 'text-red-600 bg-red-50'
    case 'sedang': return 'text-amber-600 bg-amber-50'
    case 'rendah': return 'text-green-600 bg-green-50'
  }
}

export function getDayName(dayIndex: number): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return days[dayIndex]
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

export function getJakartaDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
