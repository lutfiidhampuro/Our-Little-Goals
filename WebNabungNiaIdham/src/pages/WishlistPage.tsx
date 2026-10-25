import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import {
  formatRupiah,
  getProgress,
  getRemaining,
  getPriorityColor,
  WISHLIST_CATEGORIES,
  type PersonalWishlist,
  type WishlistPriority,
  type WishlistVisibility,
} from '../lib/types'
import {
  Heart,
  Plus,
  Sparkles,
  Lock,
  Eye,
  Filter,
  CheckCircle,
  Tag,
  Clock,
  ArrowRight,
  Gift,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

export default function WishlistPage() {
  const { user, couple, partnerId } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'mine' | 'partner'>('mine')
  const [wishlists, setWishlists] = useState<PersonalWishlist[]>([])
  const [partnerWishlists, setPartnerWishlists] = useState<PersonalWishlist[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'achieved' | 'all'>('active')

  // Create Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(WISHLIST_CATEGORIES[0])
  const [targetAmount, setTargetAmount] = useState('')
  const [minEstimate, setMinEstimate] = useState('')
  const [maxEstimate, setMaxEstimate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<WishlistPriority>('sedang')
  const [visibility, setVisibility] = useState<WishlistVisibility>('shared')
  const [photoUrl, setPhotoUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchMyWishlists()
      if (couple) {
        fetchPartnerWishlists()
      }
    }
  }, [user, couple, statusFilter])

  const fetchMyWishlists = async () => {
    if (!user) return
    setLoading(true)

    let query = supabase
      .from('personal_wishlists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    if (data) setWishlists(data)
    setLoading(false)
  }

  const fetchPartnerWishlists = async () => {
    if (!user || !couple) return

    // Find partner member
    const { data: members } = await supabase
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', couple.id)
      .neq('user_id', user.id)

    if (members && members.length > 0) {
      const pId = members[0].user_id

      let query = supabase
        .from('personal_wishlists')
        .select('*')
        .eq('user_id', pId)
        .eq('visibility', 'shared')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      if (data) setPartnerWishlists(data)
    }
  }

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nama wishlist harus diisi.')
      return
    }

    const targetVal = Number(targetAmount)
    if (!targetVal || targetVal <= 0) {
      toast.error('Target nominal harus lebih besar dari 0.')
      return
    }

    setSubmitting(true)

    const minVal = minEstimate ? Number(minEstimate) : targetVal
    const maxVal = maxEstimate ? Number(maxEstimate) : targetVal

    const { data, error } = await supabase
      .from('personal_wishlists')
      .insert({
        user_id: user!.id,
        name: name.trim(),
        description: description.trim() || null,
        category,
        target_amount: targetVal,
        min_estimate: minVal,
        max_estimate: maxVal,
        current_amount: 0,
        deadline: deadline || null,
        priority,
        visibility,
        photo_url: photoUrl.trim() || null,
        notes: notes.trim() || null,
        status: 'active',
      })
      .select()
      .single()

    setSubmitting(false)

    if (error) {
      toast.error('Gagal menambahkan wishlist: ' + error.message)
      return
    }

    toast.success('Wishlist baru berhasil ditambahkan!')
    setShowAddModal(false)
    resetForm()
    fetchMyWishlists()
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setCategory(WISHLIST_CATEGORIES[0])
    setTargetAmount('')
    setMinEstimate('')
    setMaxEstimate('')
    setDeadline('')
    setPriority('sedang')
    setVisibility('shared')
    setPhotoUrl('')
    setNotes('')
  }

  const currentList = activeTab === 'mine' ? wishlists : partnerWishlists

  const filteredList = currentList.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Gift className="text-coffee-600" size={26} />
            Wishlist Pribadi
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Tetap punya impian sendiri sambil menabung bersama pasangan tercinta
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={18} />
          Tambah Wishlist
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        <button
          onClick={() => setActiveTab('mine')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'mine'
              ? 'border-coffee-600 text-coffee-800 font-semibold'
              : 'border-transparent text-gray-500 hover:text-coffee-600'
          }`}
        >
          Wishlist Saya ({wishlists.length})
        </button>
        {couple && (
          <button
            onClick={() => setActiveTab('partner')}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'partner'
                ? 'border-coffee-600 text-coffee-800 font-semibold'
                : 'border-transparent text-gray-500 hover:text-coffee-600'
            }`}
          >
            <Heart size={14} className="text-pink-400" />
            Wishlist Pasangan ({partnerWishlists.length})
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="card-static p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
          <Filter size={14} />
          Filter:
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="text-xs py-1.5 px-3 rounded-lg border bg-white"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <option value="active">Sedang Berjalan</option>
          <option value="achieved">Sudah Tercapai ✨</option>
          <option value="all">Semua Status</option>
        </select>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs py-1.5 px-3 rounded-lg border bg-white"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <option value="all">Semua Kategori</option>
          {WISHLIST_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs py-1.5 px-3 rounded-lg border bg-white"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <option value="all">Semua Prioritas</option>
          <option value="tinggi">Prioritas Tinggi</option>
          <option value="sedang">Prioritas Sedang</option>
          <option value="rendah">Prioritas Rendah</option>
        </select>
      </div>

      {/* Wishlist Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-coffee-200 border-t-coffee-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Memuat wishlist...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="card-static p-12 text-center">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'var(--color-cream-200)', color: 'var(--color-coffee-600)' }}
          >
            <Gift size={24} />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            {activeTab === 'mine' ? 'Belum Ada Wishlist' : 'Pasangan Belum Berbagi Wishlist'}
          </h3>
          <p className="text-sm max-w-md mx-auto mb-5" style={{ color: 'var(--color-text-muted)' }}>
            {activeTab === 'mine'
              ? 'Catat barang impianmu, tentukan target, dan mulai tabung sedikit demi sedikit.'
              : 'Wishlist pasangan yang disetel publik/dibagikan akan muncul di sini.'}
          </p>
          {activeTab === 'mine' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center gap-1.5"
            >
              <Plus size={16} />
              Tambah Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((item) => {
            const progress = getProgress(item.current_amount, item.target_amount)
            const remaining = getRemaining(item.current_amount, item.target_amount)

            return (
              <Link
                key={item.id}
                to={`/wishlist/${item.id}`}
                className="card p-5 block transition-all hover:scale-[1.01]"
              >
                {/* Photo or Banner */}
                {item.photo_url && (
                  <div className="h-36 -mx-5 -mt-5 mb-4 rounded-t-xl overflow-hidden bg-gray-100">
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="badge text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                      {item.category}
                    </span>
                    <span className={`badge text-[11px] ${getPriorityColor(item.priority)}`}>
                      {item.priority === 'tinggi' ? '🔥 Tinggi' : item.priority === 'sedang' ? '⚡ Sedang' : '🌱 Santai'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-400">
                    {item.visibility === 'private' ? (
                      <span title="Hanya kamu yang bisa melihat" className="flex items-center text-xs">
                        <Lock size={13} />
                      </span>
                    ) : (
                      <span title="Dapat dilihat pasangan" className="flex items-center text-xs">
                        <Eye size={13} />
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {item.name}
                </h3>

                {item.description && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Terkumpul:</span>
                    <span className="font-semibold text-coffee-700">
                      {formatRupiah(item.current_amount)}
                    </span>
                  </div>
                  <div className="w-full bg-cream-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-coffee-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{progress}% selesai</span>
                    <span>Target: {formatRupiah(item.target_amount)}</span>
                  </div>
                </div>

                {/* Footer status */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  {item.status === 'achieved' ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle size={14} />
                      Sudah Tercapai
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      Kurang {formatRupiah(remaining)}
                    </span>
                  )}

                  <span className="text-coffee-600 font-medium flex items-center gap-1 group">
                    Detail <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="card-static w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                <Sparkles size={20} className="text-coffee-600" />
                Tambah Wishlist Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWishlist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">
                  Nama Barang / Impian <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: iPad Air M2, Tas Kulit, Parfum Favorit"
                  className="input-field text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field text-sm"
                  >
                    {WISHLIST_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">
                    Prioritas
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as WishlistPriority)}
                    className="input-field text-sm"
                  >
                    <option value="tinggi">🔥 Tinggi</option>
                    <option value="sedang">⚡ Sedang</option>
                    <option value="rendah">🌱 Santai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">
                  Target Nominal Tabungan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="Contoh: 12000000"
                  min="1000"
                  step="1000"
                  className="input-field text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">
                    Estimasi Min (Rp)
                  </label>
                  <input
                    type="number"
                    value={minEstimate}
                    onChange={(e) => setMinEstimate(e.target.value)}
                    placeholder="Contoh: 11500000"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">
                    Estimasi Max (Rp)
                  </label>
                  <input
                    type="number"
                    value={maxEstimate}
                    onChange={(e) => setMaxEstimate(e.target.value)}
                    placeholder="Contoh: 12500000"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">
                    Target Tanggal / Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">
                    Keterlihatan
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as WishlistVisibility)}
                    className="input-field text-sm"
                  >
                    <option value="shared">👀 Bagikan ke Pasangan</option>
                    <option value="private">🔒 Rahasia (Hanya Saya)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">
                  URL Foto / Referensi Produk
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">
                  Deskripsi / Catatan
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Alasan menginginkannya, link toko online, atau catatan warna/varian..."
                  rows={2}
                  className="input-field text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  {submitting ? 'Menyimpan...' : 'Simpan Wishlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
