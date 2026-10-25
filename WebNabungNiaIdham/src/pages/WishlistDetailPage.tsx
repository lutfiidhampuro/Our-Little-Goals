import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  formatRupiah,
  getProgress,
  getRemaining,
  getPriorityColor,
  formatDate,
  formatDateTime,
  type PersonalWishlist,
  type PersonalSaving,
} from '../lib/types'
import {
  ArrowLeft,
  Gift,
  Plus,
  Calendar,
  Lock,
  Eye,
  CheckCircle,
  TrendingUp,
  History,
  Trash2,
  DollarSign,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

export default function WishlistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [wishlist, setWishlist] = useState<PersonalWishlist | null>(null)
  const [savingsHistory, setSavingsHistory] = useState<PersonalSaving[]>([])
  const [loading, setLoading] = useState(true)

  // Deposit modal
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositNote, setDepositNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) fetchWishlistDetail()
  }, [id])

  const fetchWishlistDetail = async () => {
    if (!id) return
    setLoading(true)

    const { data: itemData, error } = await supabase
      .from('personal_wishlists')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !itemData) {
      toast.error('Wishlist tidak ditemukan.')
      navigate('/wishlist')
      return
    }

    setWishlist(itemData)

    // Fetch personal savings for this wishlist
    const { data: savings } = await supabase
      .from('personal_savings')
      .select('*')
      .eq('wishlist_id', id)
      .order('created_at', { ascending: false })

    if (savings) setSavingsHistory(savings)
    setLoading(false)
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wishlist || !user) return

    const amount = Number(depositAmount)
    if (!amount || amount <= 0) {
      toast.error('Nominal tabungan harus lebih dari Rp 0.')
      return
    }

    setSubmitting(true)

    // 1. Insert personal saving record
    const { error: saveError } = await supabase.from('personal_savings').insert({
      wishlist_id: wishlist.id,
      user_id: user.id,
      amount,
      notes: depositNote.trim() || null,
    })

    if (saveError) {
      setSubmitting(false)
      toast.error('Gagal mencatat tabungan: ' + saveError.message)
      return
    }

    // 2. Update current_amount in personal_wishlists
    const newTotal = wishlist.current_amount + amount
    const isNowAchieved = newTotal >= wishlist.target_amount

    const { error: updateError } = await supabase
      .from('personal_wishlists')
      .update({
        current_amount: newTotal,
        status: isNowAchieved ? 'achieved' : wishlist.status,
      })
      .eq('id', wishlist.id)

    setSubmitting(false)

    if (updateError) {
      toast.error('Gagal memperbarui total wishlist: ' + updateError.message)
      return
    }

    if (isNowAchieved && wishlist.status !== 'achieved') {
      toast.success('🎉 SELAMAT! Target wishlist kamu sudah tercapai!')
    } else {
      toast.success(`Berhasil menyisihkan ${formatRupiah(amount)} untuk ${wishlist.name}!`)
    }

    setShowDepositModal(false)
    setDepositAmount('')
    setDepositNote('')
    fetchWishlistDetail()
  }

  const handleDelete = async () => {
    if (!wishlist || !window.confirm('Yakin ingin menghapus wishlist ini beserta riwayatnya?')) {
      return
    }

    setLoading(true)
    const { error } = await supabase.from('personal_wishlists').delete().eq('id', wishlist.id)
    setLoading(false)

    if (error) {
      toast.error('Gagal menghapus: ' + error.message)
      return
    }

    toast.success('Wishlist berhasil dihapus.')
    navigate('/wishlist')
  }

  if (loading || !wishlist) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-3 border-coffee-200 border-t-coffee-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400">Memuat detail wishlist...</p>
      </div>
    )
  }

  const isOwner = user?.id === wishlist.user_id
  const progress = getProgress(wishlist.current_amount, wishlist.target_amount)
  const remaining = getRemaining(wishlist.current_amount, wishlist.target_amount)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/wishlist"
          className="inline-flex items-center gap-1.5 text-sm transition-colors cursor-pointer text-gray-500 hover:text-coffee-700"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Wishlist
        </Link>

        {isOwner && (
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 text-xs inline-flex items-center gap-1 p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Hapus
          </button>
        )}
      </div>

      {/* Main Detail Card */}
      <div className="card-static overflow-hidden">
        {wishlist.photo_url && (
          <div className="h-56 sm:h-72 w-full bg-gray-100 overflow-hidden relative">
            <img
              src={wishlist.photo_url}
              alt={wishlist.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="badge text-xs bg-amber-50 text-amber-700 border border-amber-200">
                {wishlist.category}
              </span>
              <span className={`badge text-xs ${getPriorityColor(wishlist.priority)}`}>
                Prioritas: {wishlist.priority.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 py-1 px-2.5 rounded-full border border-gray-200">
              {wishlist.visibility === 'private' ? (
                <>
                  <Lock size={12} /> Pribadi
                </>
              ) : (
                <>
                  <Eye size={12} /> Dibagikan dengan Pasangan
                </>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
              {wishlist.name}
            </h1>
            {wishlist.description && (
              <p className="text-sm sm:text-base text-gray-600 mt-2 leading-relaxed">
                {wishlist.description}
              </p>
            )}
          </div>

          {/* Progress Tracker Card */}
          <div className="p-5 rounded-2xl border" style={{ background: 'var(--color-cream-100)', borderColor: 'var(--color-border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
              <div>
                <span className="text-xs text-gray-500 font-medium">Terkumpul Saat Ini</span>
                <div className="text-2xl sm:text-3xl font-bold text-coffee-800">
                  {formatRupiah(wishlist.current_amount)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 font-medium">Target Total</span>
                <div className="text-lg font-semibold text-gray-700">
                  {formatRupiah(wishlist.target_amount)}
                </div>
              </div>
            </div>

            {/* Bar */}
            <div className="w-full bg-cream-300 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-coffee-600 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs mt-2 text-gray-600 font-medium">
              <span>{progress}% tercapai</span>
              {wishlist.status === 'achieved' ? (
                <span className="text-green-700 font-semibold flex items-center gap-1">
                  <CheckCircle size={14} /> Impian Terpenuhi!
                </span>
              ) : (
                <span>Kurang {formatRupiah(remaining)}</span>
              )}
            </div>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-white rounded-xl border border-gray-100">
              <span className="text-[11px] text-gray-400 block">Estimasi Rentang</span>
              <span className="text-xs font-semibold text-gray-700">
                {formatRupiah(wishlist.min_estimate)} - {formatRupiah(wishlist.max_estimate)}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-100">
              <span className="text-[11px] text-gray-400 block">Target Tanggal</span>
              <span className="text-xs font-semibold text-gray-700">
                {wishlist.deadline ? formatDate(wishlist.deadline) : 'Fleksibel'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-100 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-gray-400 block">Status Impian</span>
              <span className="text-xs font-semibold text-gray-700 capitalize">
                {wishlist.status === 'achieved' ? 'Sudah Tercapai ✨' : 'Dalam Tabungan 🎯'}
              </span>
            </div>
          </div>

          {/* Notes if available */}
          {wishlist.notes && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
              <strong>Catatan:</strong> {wishlist.notes}
            </div>
          )}

          {/* Action button: Menabung ke wishlist */}
          {isOwner && (
            <div className="pt-2">
              <button
                onClick={() => setShowDepositModal(true)}
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Sisihkan Tabungan ke Wishlist Ini
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Saving History for this item */}
      <div className="card-static p-6 space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <History size={18} className="text-coffee-600" />
          Riwayat Alokasi Tabungan
        </h3>

        {savingsHistory.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            Belum ada setoran tabungan untuk wishlist ini. Mulai sisihkan sekarang!
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {savingsHistory.map((sh) => (
              <div key={sh.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-gray-800">
                    +{formatRupiah(sh.amount)}
                  </div>
                  {sh.notes && <div className="text-xs text-gray-500">{sh.notes}</div>}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDateTime(sh.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="card-static w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <DollarSign size={18} className="text-coffee-600" />
              Sisihkan Tabungan Pribadi
            </h3>
            <p className="text-xs text-gray-500">
              Menabung untuk: <strong className="text-gray-700">{wishlist.name}</strong>
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">
                  Nominal Tabungan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Contoh: 50000"
                  min="1000"
                  step="1000"
                  className="input-field"
                  required
                  autoFocus
                />
              </div>

              {/* Quick nominal buttons */}
              <div className="flex flex-wrap gap-2">
                {[20000, 50000, 100000, 200000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(String(amt))}
                    className="text-xs py-1 px-2.5 rounded-lg border border-coffee-200 bg-cream-50 hover:bg-cream-100 text-coffee-700 font-medium"
                  >
                    +{formatRupiah(amt)}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">
                  Catatan (opsional)
                </label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="Contoh: Sisa uang jajan mingguan"
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="btn-secondary text-sm py-2 px-4"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm py-2 px-5"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Tabungan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
