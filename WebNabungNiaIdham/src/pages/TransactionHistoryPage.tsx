import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import {
  formatRupiah,
  formatDateTime,
  formatDate,
  type ContributionStatus,
} from '../lib/types'
import {
  History,
  Filter,
  Download,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  Clock,
  XCircle,
  PiggyBank,
  Gift,
  FileSpreadsheet,
} from 'lucide-react'
import { toast } from 'sonner'

export default function TransactionHistoryPage() {
  const { user, couple } = useAuthStore()

  const [activeType, setActiveType] = useState<'all' | 'couple' | 'personal' | 'expense'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Combined transactions list
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchAllTransactions()
    }
  }, [user, couple, activeType, statusFilter])

  const fetchAllTransactions = async () => {
    if (!user) return
    setLoading(true)

    const allTx: any[] = []

    // 1. Couple contributions
    if (couple && (activeType === 'all' || activeType === 'couple')) {
      let query = supabase
        .from('savings_contributions')
        .select('*, profiles:user_id(full_name), savings_goals:goal_id(name)')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      if (data) {
        data.forEach((c) => {
          allTx.push({
            id: c.id,
            type: 'couple_savings',
            title: c.savings_goals?.name || 'Tabungan Bersama',
            user_name: c.profiles?.full_name || 'Partner',
            amount: c.amount,
            is_income: true,
            status: c.status,
            notes: c.notes,
            created_at: c.created_at,
          })
        })
      }
    }

    // 2. Personal savings
    if (activeType === 'all' || activeType === 'personal') {
      const { data } = await supabase
        .from('personal_savings')
        .select('*, personal_wishlists:wishlist_id(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        data.forEach((ps) => {
          allTx.push({
            id: ps.id,
            type: 'personal_savings',
            title: `Wishlist: ${ps.personal_wishlists?.name || 'Pribadi'}`,
            user_name: 'Saya',
            amount: ps.amount,
            is_income: true,
            status: 'verified',
            notes: ps.notes,
            created_at: ps.created_at,
          })
        })
      }
    }

    // 3. Expenses
    if (couple && (activeType === 'all' || activeType === 'expense')) {
      let query = supabase
        .from('expense_requests')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      if (data) {
        data.forEach((exp) => {
          allTx.push({
            id: exp.id,
            type: 'expense',
            title: `Pengeluaran: ${exp.reason}`,
            user_name: 'Pengajuan',
            amount: exp.amount,
            is_income: false,
            status: exp.status,
            notes: exp.notes,
            created_at: exp.created_at,
          })
        })
      }
    }

    // Sort by created_at desc
    allTx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setTransactions(allTx)
    setLoading(false)
  }

  // Filtered by search
  const filtered = transactions.filter((t) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      t.title.toLowerCase().includes(q) ||
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      t.user_name.toLowerCase().includes(q)
    )
  })

  // Export CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('Tidak ada data untuk diekspor.')
      return
    }

    const headers = ['ID', 'Tipe', 'Judul / Target', 'User', 'Nominal', 'Status', 'Catatan', 'Tanggal']
    const rows = filtered.map((t) => [
      t.id,
      t.type,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.user_name}"`,
      t.amount,
      t.status,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      formatDateTime(t.created_at),
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `riwayat-tabungan-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('File CSV berhasil diunduh!')
  }

  // Summary
  const totalIn = filtered
    .filter((t) => t.is_income && (t.status === 'verified' || t.type === 'personal_savings'))
    .reduce((acc, t) => acc + t.amount, 0)

  const totalOut = filtered
    .filter((t) => !t.is_income && t.status === 'approved')
    .reduce((acc, t) => acc + t.amount, 0)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <History className="text-coffee-600" size={26} />
            Riwayat Transaksi
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Transparansi penuh seluruh alur tabungan dan penggunaan dana
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn-secondary text-xs py-2 px-3.5 inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FileSpreadsheet size={15} />
          Ekspor CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-static p-4 flex items-center justify-between border-l-4 border-emerald-600">
          <div>
            <span className="text-xs text-gray-500 font-medium">Total Tabungan Masuk (Terverifikasi)</span>
            <div className="text-2xl font-bold text-emerald-800">
              +{formatRupiah(totalIn)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
            <ArrowDownLeft size={20} />
          </div>
        </div>

        <div className="card-static p-4 flex items-center justify-between border-l-4 border-burgundy-600">
          <div>
            <span className="text-xs text-gray-500 font-medium">Total Pengeluaran Disetujui</span>
            <div className="text-2xl font-bold text-burgundy-800">
              -{formatRupiah(totalOut)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-burgundy-700">
            <ArrowUpRight size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-static p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, target, atau catatan..."
              className="input-field pl-9 text-xs py-2"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type selector */}
            <select
              value={activeType}
              onChange={(e) => setActiveType(e.target.value as any)}
              className="text-xs py-2 px-3 rounded-lg border bg-white"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <option value="all">Semua Tipe Transaksi</option>
              <option value="couple">Tabungan Bersama</option>
              <option value="personal">Wishlist Pribadi</option>
              <option value="expense">Pengeluaran</option>
            </select>

            {/* Status selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border bg-white"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <option value="all">Semua Status</option>
              <option value="verified">Terverifikasi / Berhasil</option>
              <option value="pending">Menunggu Verifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="card-static overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-coffee-200 border-t-coffee-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Memuat riwayat transaksi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <History size={40} className="mx-auto opacity-30" />
            <p className="text-sm">Tidak ada transaksi yang cocok dengan filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((tx) => {
              const isIncome = tx.is_income
              return (
                <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-cream-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-burgundy-600'
                      }`}
                    >
                      {tx.type === 'couple_savings' ? (
                        <PiggyBank size={18} />
                      ) : tx.type === 'personal_savings' ? (
                        <Gift size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-gray-800">
                          {tx.title}
                        </h4>
                        <span
                          className={`badge text-[10px] ${
                            tx.status === 'verified' || tx.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : tx.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {tx.status === 'verified' || tx.status === 'approved'
                            ? 'Selesai'
                            : tx.status === 'pending'
                            ? 'Menunggu'
                            : 'Ditolak'}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                        <span>Oleh: {tx.user_name}</span>
                        <span>•</span>
                        <span>{formatDateTime(tx.created_at)}</span>
                      </div>

                      {tx.notes && (
                        <p className="text-xs text-gray-400 italic pt-0.5">
                          "{tx.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <div
                      className={`font-bold text-base ${
                        isIncome ? 'text-emerald-700' : 'text-burgundy-700'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatRupiah(tx.amount)}
                    </div>
                    <span className="text-[10px] text-gray-400 block">
                      {tx.type === 'couple_savings'
                        ? 'Tabungan Bersama'
                        : tx.type === 'personal_savings'
                        ? 'Wishlist'
                        : 'Pengeluaran'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
