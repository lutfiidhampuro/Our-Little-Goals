import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  formatRupiah,
  getProgress,
  getRemaining,
  getCategoryEmoji,
  formatDate,
  formatDateTime,
  DEPOSIT_AMOUNTS,
  type SavingsGoal,
  type SavingsContribution,
  type ContributionStatus,
  type DepositAmount,
  type Profile,
} from '../lib/types'
import {
  ArrowLeft,
  PiggyBank,
  Calendar,
  MapPin,
  Edit,
  Archive,
  CheckCircle,
  X,
  AlertCircle,
} from 'lucide-react'

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile, couple, isTreasurer } = useAuthStore()

  const [goal, setGoal] = useState<SavingsGoal | null>(null)
  const [contributions, setContributions] = useState<(SavingsContribution & { profiles?: Profile })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAmount, setSelectedAmount] = useState<DepositAmount | null>(null)
  const [depositNote, setDepositNote] = useState('')
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (id) fetchGoalDetail()
  }, [id])

  const fetchGoalDetail = async () => {
    if (!id) return
    setLoading(true)

    const { data: goalData } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', id)
      .single()

    if (goalData) setGoal(goalData)

    const { data: contribData } = await supabase
      .from('savings_contributions')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('goal_id', id)
      .order('created_at', { ascending: false })

    if (contribData) setContributions(contribData as any)
    setLoading(false)
  }

  const handleDeposit = async () => {
    if (!selectedAmount || !goal || !user || !couple) return
    setSubmitting(true)

    const { error } = await supabase.from('savings_contributions').insert({
      goal_id: goal.id,
      couple_id: couple.id,
      user_id: user.id,
      amount: selectedAmount,
      status: 'pending' as ContributionStatus,
      notes: depositNote || null,
    })

    if (error) {
      toast.error('Gagal mengirim setoran: ' + error.message)
      setSubmitting(false)
      return
    }

    // Create notification for treasurer
    if (couple.treasurer_id && couple.treasurer_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: couple.treasurer_id,
        type: 'contribution_new',
        title: 'Setoran Baru',
        message: `${profile?.full_name} mengirim setoran ${formatRupiah(selectedAmount)} untuk "${goal.name}". Menunggu verifikasi.`,
        reference_id: goal.id,
        reference_type: 'savings_goal',
      })
    }

    // Mark daily activity
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('daily_saving_activity').upsert({
      user_id: user.id,
      date: today,
      has_saved: true,
      total_amount: selectedAmount,
    }, { onConflict: 'user_id,date' })

    toast.success('Setoran berhasil dikirim! Menunggu verifikasi bendahara.')
    setShowDepositModal(false)
    setShowConfirm(false)
    setSelectedAmount(null)
    setDepositNote('')
    setSubmitting(false)
    fetchGoalDetail()
  }

  const handleArchive = async () => {
    if (!goal) return
    const { error } = await supabase
      .from('savings_goals')
      .update({ status: 'archived' })
      .eq('id', goal.id)

    if (error) {
      toast.error('Gagal mengarsipkan.')
      return
    }
    toast.success('Target diarsipkan.')
    navigate('/tabungan')
  }

  const handleMarkAchieved = async () => {
    if (!goal) return
    const { error } = await supabase
      .from('savings_goals')
      .update({ status: 'achieved' })
      .eq('id', goal.id)

    if (error) {
      toast.error('Gagal menandai tercapai.')
      return
    }
    toast.success('🎉 Target ditandai sebagai tercapai!')
    fetchGoalDetail()
  }

  const cancelContribution = async (contribId: string) => {
    const { error } = await supabase
      .from('savings_contributions')
      .delete()
      .eq('id', contribId)
      .eq('status', 'pending')

    if (error) {
      toast.error('Gagal membatalkan setoran.')
      return
    }
    toast.success('Setoran dibatalkan.')
    fetchGoalDetail()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-coffee-200 border-t-coffee-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--color-coffee-200)' }} />
        <p className="text-lg font-semibold">Target tidak ditemukan</p>
        <Link to="/tabungan" className="btn-primary mt-4 inline-flex">
          Kembali
        </Link>
      </div>
    )
  }

  const progress = getProgress(goal.current_amount, goal.target_amount)
  const remaining = getRemaining(goal.current_amount, goal.target_amount)
  const verifiedTotal = contributions
    .filter((c) => c.status === 'verified')
    .reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/tabungan')} className="p-2 rounded-lg hover:bg-cream-100">
          <ArrowLeft size={20} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            {getCategoryEmoji(goal.category)} {goal.name}
          </h2>
          {goal.destination && (
            <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
              <MapPin size={14} /> {goal.destination}{goal.city ? `, ${goal.city}` : ''}
            </p>
          )}
        </div>
        {goal.status === 'achieved' && (
          <span className="badge badge-verified text-sm">✅ Tercapai</span>
        )}
      </div>

      {/* Goal Stats */}
      <div className="card-static p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Terkumpul</p>
            <p className="text-lg font-bold" style={{ color: 'var(--color-success)' }}>
              {formatRupiah(goal.current_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Target</p>
            <p className="text-lg font-bold">{formatRupiah(goal.target_amount)}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sisa</p>
            <p className="text-lg font-bold" style={{ color: 'var(--color-warning)' }}>
              {formatRupiah(remaining)}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Estimasi</p>
            <p className="text-sm font-medium">
              {formatRupiah(goal.min_estimate)} – {formatRupiah(goal.max_estimate)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progres</span>
            <span className="text-xl font-bold" style={{
              color: progress >= 100 ? 'var(--color-success)' : 'var(--color-coffee-600)'
            }}>
              {progress}%
            </span>
          </div>
          <div className="w-full h-4 rounded-full" style={{ background: 'var(--color-cream-200)' }}>
            <div
              className="h-full rounded-full progress-bar-fill"
              style={{
                '--progress': `${progress}%`,
                background: progress >= 100 ? 'var(--color-success)' : 'var(--color-coffee-400)',
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <span className="flex items-center gap-1">
            <Calendar size={14} /> Mulai: {formatDate(goal.start_date)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} /> Deadline: {formatDate(goal.deadline)}
          </span>
        </div>

        {goal.description && (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {goal.description}
          </p>
        )}
        {goal.notes && (
          <p className="mt-2 text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
            📝 {goal.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      {goal.status === 'active' && (
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowDepositModal(true)} className="btn-primary flex-1 min-w-[160px]">
            <PiggyBank size={18} /> Tambah Tabungan
          </button>
          <button onClick={handleMarkAchieved} className="btn-success">
            <CheckCircle size={18} /> Tandai Tercapai
          </button>
          <button onClick={handleArchive} className="btn-secondary">
            <Archive size={18} /> Arsipkan
          </button>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !showConfirm && setShowDepositModal(false)}>
          <div
            className="card-static p-6 w-full max-w-md animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {!showConfirm ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                    Tambah Tabungan
                  </h3>
                  <button onClick={() => setShowDepositModal(false)}>
                    <X size={20} style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                </div>

                <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Pilih nominal setoran untuk <strong>{goal.name}</strong>
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {DEPOSIT_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedAmount(amount)}
                      className={`btn-amount ${selectedAmount === amount ? 'selected' : ''}`}
                    >
                      {formatRupiah(amount)}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Catatan (opsional)
                  </label>
                  <input
                    type="text"
                    value={depositNote}
                    onChange={(e) => setDepositNote(e.target.value)}
                    className="input-field"
                    placeholder="Tambahkan catatan..."
                  />
                </div>

                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!selectedAmount}
                  className="btn-primary w-full"
                >
                  Lanjutkan
                </button>

                <p className="text-xs text-center mt-3" style={{ color: 'var(--color-text-muted)' }}>
                  Setoran akan menunggu verifikasi bendahara.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Konfirmasi Setoran
                </h3>

                <div className="space-y-3 mb-6 p-4 rounded-xl" style={{ background: 'var(--color-cream-100)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-text-muted)' }}>Penyetor</span>
                    <span className="font-medium">{profile?.full_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-text-muted)' }}>Tujuan</span>
                    <span className="font-medium">{goal.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-text-muted)' }}>Nominal</span>
                    <span className="font-bold text-lg" style={{ color: 'var(--color-coffee-600)' }}>
                      {selectedAmount ? formatRupiah(selectedAmount) : '-'}
                    </span>
                  </div>
                  {depositNote && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-text-muted)' }}>Catatan</span>
                      <span>{depositNote}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
                    <span className="badge badge-pending">Menunggu Verifikasi</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg mb-4" style={{ background: '#FFF3CD' }}>
                  <p className="text-xs" style={{ color: '#856404' }}>
                    ⚠️ Setoran ini akan dicatat sebagai "menunggu verifikasi". Bendahara akan memverifikasi setelah dana fisik diterima. Website tidak memindahkan uang secara otomatis.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">
                    Kembali
                  </button>
                  <button onClick={handleDeposit} disabled={submitting} className="btn-primary flex-1">
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Konfirmasi'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contribution History */}
      <div>
        <h3 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
          Riwayat Kontribusi
        </h3>

        {contributions.length === 0 ? (
          <div className="card-static p-6 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Belum ada kontribusi.
            </p>
          </div>
        ) : (
          <div className="card-static divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
            {contributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{ background: 'var(--color-coffee-400)' }}
                  >
                    {(c.profiles as any)?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {(c.profiles as any)?.full_name || 'Pengguna'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDateTime(c.created_at)}
                      {c.notes && ` • ${c.notes}`}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                      +{formatRupiah(c.amount)}
                    </p>
                    <span className={`badge text-xs ${
                      c.status === 'verified' ? 'badge-verified' :
                      c.status === 'pending' ? 'badge-pending' :
                      c.status === 'rejected' ? 'badge-rejected' : 'badge-planned'
                    }`}>
                      {c.status === 'verified' ? 'Terverifikasi' :
                       c.status === 'pending' ? 'Menunggu' :
                       c.status === 'rejected' ? 'Ditolak' : 'Direncanakan'}
                    </span>
                  </div>
                  {c.status === 'pending' && c.user_id === user?.id && (
                    <button
                      onClick={() => cancelContribution(c.id)}
                      className="text-xs text-red-500 hover:text-red-700 p-1"
                      title="Batalkan"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
