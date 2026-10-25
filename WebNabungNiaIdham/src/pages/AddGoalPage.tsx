import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  GOAL_CATEGORIES,
  type GoalCategory,
} from '../lib/types'
import {
  ArrowLeft,
  Target,
  Sparkles,
  Calendar,
  DollarSign,
  MapPin,
  Tag,
  FileText,
  Image,
} from 'lucide-react'

export default function AddGoalPage() {
  const navigate = useNavigate()
  const { user, couple } = useAuthStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GoalCategory>('liburan')
  const [destination, setDestination] = useState('')
  const [city, setCity] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [minEstimate, setMinEstimate] = useState('')
  const [maxEstimate, setMaxEstimate] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!couple) {
    return (
      <div className="text-center py-20">
        <Target size={48} className="mx-auto mb-4" style={{ color: 'var(--color-coffee-200)' }} />
        <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Belum Ada Ruang Tabungan
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Kamu perlu membuat atau bergabung ke ruang tabungan pasangan sebelum membuat target.
        </p>
        <Link to="/dashboard" className="btn-primary mt-4 inline-flex">
          Ke Dashboard
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nama target tabungan harus diisi.')
      return
    }

    const targetVal = Number(targetAmount)
    if (!targetVal || targetVal <= 0) {
      toast.error('Target nominal harus lebih besar dari 0.')
      return
    }

    if (!deadline) {
      toast.error('Tanggal target/deadline harus diisi.')
      return
    }

    if (new Date(deadline) <= new Date(startDate)) {
      toast.error('Tanggal deadline harus setelah tanggal mulai.')
      return
    }

    setLoading(true)

    const minEstVal = minEstimate ? Number(minEstimate) : targetVal
    const maxEstVal = maxEstimate ? Number(maxEstimate) : targetVal

    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        couple_id: couple.id,
        created_by: user!.id,
        name: name.trim(),
        description: description.trim() || null,
        category,
        destination: destination.trim() || null,
        city: city.trim() || null,
        photo_url: photoUrl.trim() || null,
        min_estimate: minEstVal,
        max_estimate: maxEstVal,
        target_amount: targetVal,
        current_amount: 0,
        start_date: startDate,
        deadline,
        notes: notes.trim() || null,
        status: 'active',
      })
      .select()
      .single()

    setLoading(false)

    if (error) {
      toast.error('Gagal membuat target tabungan: ' + error.message)
      return
    }

    // Insert audit log
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'create_savings_goal',
      entity_type: 'savings_goals',
      entity_id: data.id,
      details: { name: name.trim(), target_amount: targetVal },
    })

    toast.success('Target tabungan baru berhasil dibuat!')
    navigate(`/tabungan/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm transition-colors cursor-pointer"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
      </div>

      {/* Header Card */}
      <div className="card-static p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-cream-200)', color: 'var(--color-coffee-700)' }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Buat Target Tabungan Bersama
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Rencanakan tujuan indah berikutnya bersama pasangan tercinta
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Target Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Nama Target <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Liburan ke Bali, Tabungan Nikah, DP Rumah"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <Tag size={15} className="inline mr-1" />
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GoalCategory)}
              className="input-field"
            >
              {GOAL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Deskripsi Singkat
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan impian atau rencana di balik target ini..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <DollarSign size={15} className="inline mr-1" />
              Target Nominal Tabungan (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="Contoh: 5000000"
              min="1000"
              step="1000"
              className="input-field"
              required
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Nominal total yang ingin dikumpulkan berdua.
            </p>
          </div>

          {/* Min & Max Estimate (Optional range) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Estimasi Minimal (Rp) <span className="text-xs text-gray-400">(opsional)</span>
              </label>
              <input
                type="number"
                value={minEstimate}
                onChange={(e) => setMinEstimate(e.target.value)}
                placeholder="Contoh: 4500000"
                min="0"
                step="1000"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Estimasi Maksimal (Rp) <span className="text-xs text-gray-400">(opsional)</span>
              </label>
              <input
                type="number"
                value={maxEstimate}
                onChange={(e) => setMaxEstimate(e.target.value)}
                placeholder="Contoh: 6000000"
                min="0"
                step="1000"
                className="input-field"
              />
            </div>
          </div>

          {/* Location fields if category is liburan/kuliner */}
          {(category === 'liburan' || category === 'kuliner') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl" style={{ background: 'var(--color-cream-100)' }}>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <MapPin size={15} className="inline mr-1" />
                  Destinasi / Tempat
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Contoh: Pantai Kuta / Resto Cafe"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Kota / Wilayah
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Denpasar, Bali"
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                <Calendar size={15} className="inline mr-1" />
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                <Calendar size={15} className="inline mr-1" />
                Target Selesai / Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={startDate}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <Image size={15} className="inline mr-1" />
              URL Gambar Cover <span className="text-xs text-gray-400">(opsional)</span>
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="input-field"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <FileText size={15} className="inline mr-1" />
              Catatan Khusus <span className="text-xs text-gray-400">(opsional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan, strategi menabung berdua, atau detail penting..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Simpan Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
