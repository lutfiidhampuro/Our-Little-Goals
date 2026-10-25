import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import {
  formatRupiah,
  getProgress,
  getCategoryEmoji,
  formatDate,
  type SavingsGoal,
} from '../lib/types'
import { Plus, Target, Filter } from 'lucide-react'

export default function SavingsGoalsPage() {
  const { couple } = useAuthStore()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'achieved' | 'archived' | 'all'>('active')

  useEffect(() => {
    if (couple) fetchGoals()
  }, [couple, filter])

  const fetchGoals = async () => {
    if (!couple) return
    setLoading(true)

    let query = supabase
      .from('savings_goals')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    if (data) setGoals(data)
    setLoading(false)
  }

  if (!couple) {
    return (
      <div className="text-center py-20">
        <Target size={48} className="mx-auto mb-4" style={{ color: 'var(--color-coffee-200)' }} />
        <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Belum ada ruang tabungan
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Buat atau gabung ke ruang tabungan bersama di Dashboard.
        </p>
        <Link to="/dashboard" className="btn-primary mt-4 inline-flex">
          Ke Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            Tabungan Bersama
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Kelola tujuan menabung berdua
          </p>
        </div>
        <Link to="/tabungan/tambah" className="btn-primary">
          <Plus size={18} /> Tambah
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: 'active' as const, label: 'Aktif' },
          { value: 'achieved' as const, label: 'Tercapai' },
          { value: 'archived' as const, label: 'Arsip' },
          { value: 'all' as const, label: 'Semua' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === f.value
                ? 'text-white'
                : ''
            }`}
            style={{
              background: filter === f.value ? 'var(--color-coffee-600)' : 'var(--color-cream-100)',
              color: filter === f.value ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-coffee-200 border-t-coffee-600 rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="card-static p-12 text-center">
          <Target size={48} className="mx-auto mb-4" style={{ color: 'var(--color-coffee-200)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            {filter === 'active' ? 'Belum ada target aktif' : 'Tidak ada data'}
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {filter === 'active'
              ? 'Mulai tambahkan tujuan menabung pertama kalian!'
              : 'Belum ada target dengan status ini.'}
          </p>
          {filter === 'active' && (
            <Link to="/tabungan/tambah" className="btn-primary inline-flex">
              <Plus size={18} /> Tambah Target Baru
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = getProgress(goal.current_amount, goal.target_amount)
            const remaining = Math.max(goal.target_amount - goal.current_amount, 0)

            return (
              <Link
                key={goal.id}
                to={`/tabungan/${goal.id}`}
                className="card p-5 block"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: 'var(--color-cream-100)' }}
                  >
                    {getCategoryEmoji(goal.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                      {goal.name}
                    </h4>
                    {goal.destination && (
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        📍 {goal.destination}{goal.city ? `, ${goal.city}` : ''}
                      </p>
                    )}
                  </div>
                  {goal.status === 'achieved' && (
                    <span className="badge badge-verified">✅ Tercapai</span>
                  )}
                </div>

                {/* Amount */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div>
                    <p style={{ color: 'var(--color-text-muted)' }} className="text-xs">Terkumpul</p>
                    <p className="font-semibold" style={{ color: 'var(--color-success)' }}>
                      {formatRupiah(goal.current_amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: 'var(--color-text-muted)' }} className="text-xs">Target</p>
                    <p className="font-semibold">{formatRupiah(goal.target_amount)}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      Progres
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: progress >= 100 ? 'var(--color-success)' : 'var(--color-coffee-600)' }}
                    >
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full" style={{ background: 'var(--color-cream-200)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progress}%`,
                        background: progress >= 100 ? 'var(--color-success)' : 'var(--color-coffee-400)',
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span>Sisa: {formatRupiah(remaining)}</span>
                  <span>Deadline: {formatDate(goal.deadline)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
