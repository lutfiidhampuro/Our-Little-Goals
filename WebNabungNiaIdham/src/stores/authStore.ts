import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Profile, Couple, CoupleMember } from '../lib/types'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  couple: Couple | null
  coupleMember: CoupleMember | null
  partnerId: string | null
  isLoading: boolean
  isDarkMode: boolean

  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setCouple: (couple: Couple | null) => void
  setCoupleMember: (member: CoupleMember | null) => void
  setPartnerId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  toggleDarkMode: () => void
  reset: () => void
  isTreasurer: () => boolean
  fetchProfile: () => Promise<void>
  fetchCoupleData: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  couple: null,
  coupleMember: null,
  partnerId: null,
  isLoading: true,
  isDarkMode: localStorage.getItem('darkMode') === 'true',

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setCouple: (couple) => set({ couple }),
  setCoupleMember: (member) => set({ coupleMember: member }),
  setPartnerId: (id) => set({ partnerId: id }),
  setLoading: (isLoading) => set({ isLoading }),

  toggleDarkMode: () => {
    const newMode = !get().isDarkMode
    localStorage.setItem('darkMode', String(newMode))
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    set({ isDarkMode: newMode })
  },

  reset: () => set({
    user: null,
    session: null,
    profile: null,
    couple: null,
    coupleMember: null,
    partnerId: null,
  }),

  isTreasurer: () => {
    const { coupleMember, profile } = get()
    return coupleMember?.role === 'treasurer' || profile?.is_treasurer === true
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      set({ profile: data })
    }
  },

  fetchCoupleData: async () => {
    const { user } = get()
    if (!user) return

    // Fetch couple membership
    const { data: memberData } = await supabase
      .from('couple_members')
      .select('*, couples(*)')
      .eq('user_id', user.id)
      .single()

    if (memberData) {
      const couple = (memberData as any).couples as Couple
      set({
        coupleMember: {
          id: memberData.id,
          couple_id: memberData.couple_id,
          user_id: memberData.user_id,
          role: memberData.role,
          joined_at: memberData.joined_at,
        },
        couple,
      })

      // Find partner
      const { data: partnerMember } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', memberData.couple_id)
        .neq('user_id', user.id)
        .single()

      if (partnerMember) {
        set({ partnerId: partnerMember.user_id })
      }
    }
  },
}))
