import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  formatRupiah,
  formatDateTime,
  type SavingsContribution,
  type ExpenseRequest,
} from '../lib/types'
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Wallet,
  Users,
  FileText,
  BadgeAlert,
} from 'lucide-react'

export default function TreasurerPage() {
  const { user, profile, couple, isTreasurer } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'deposits' | 'expenses' | 'logs'>('deposits')
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([])
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Quick stats
  const [totalVerifiedSavings, setTotalVerifiedSavings] = useState(0)
  const [totalApprovedExpenses, setTotalApprovedExpenses] = useState(0)

  // Rejection modal
  const [rejectItem, setRejectItem] = useState<{ id: string; type: 'deposit' | 'expense' } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (couple) {
      fetchTreasurerData()
    }
  }, [couple, activeTab])

  const fetchTreasurerData = async () => {
    if (!couple) return
    setLoading(true)

    // 1. Fetch pending deposits
    const { data: deposits } = await supabase
      .from('savings_contributions')
      .select('*, profiles:user_id(full_name, email), savings_goals:goal_id(name)')
      .eq('couple_id', couple.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (deposits) setPendingDeposits(deposits)

    // 2. Fetch pending expenses
    const { data: expenses } = await supabase
      .from('expense_requests')
      .select('*, profiles:requested_by(full_name), savings_goals:goal_id(name)')
      .eq('couple_id', couple.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (expenses) setPendingExpenses(expenses)

    // 3. Totals for treasury balance
    const { data: verifiedContribs } = await supabase
      .from('savings_contributions')
      .select('amount')
      .eq('couple_id', couple.id)
      .eq('status', 'verified')

    const vSum = verifiedContribs?.reduce((acc, c) => acc + c.amount, 0) || 0
    setTotalVerifiedSavings(vSum)

    const { data: approvedExps } = await supabase
      .from('expense_requests')
      .select('amount')
      .eq('couple_id', couple.id)
      .eq('status', 'approved')

    const eSum = approvedExps?.reduce((acc, e) => acc + e.amount, 0) || 0
    setTotalApprovedExpenses(eSum)

    // 4. Audit logs
    if (activeTab === 'logs') {
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)

      if (logs) setAuditLogs(logs)
    }

    setLoading(false)
  }

  // Verify deposit
  const handleVerifyDeposit = async (contribution: any) => {
    setActionLoading(true)

    // Update contribution status to verified
    const { error: contribError } = await supabase
      .from('savings_contributions')
      .update({
        status: 'verified',
        verified_by: user!.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', contribution.id)

    if (contribError) {
      setActionLoading(false)
      toast.error('Gagal memverifikasi: ' + contribError.message)
      return
    }

    // Increase goal current_amount
    const { data: goalData } = await supabase
      .from('savings_goals')
      .select('current_amount, target_amount')
      .eq('id', contribution.goal_id)
      .single()

    if (goalData) {
      const newAmount = goalData.current_amount + contribution.amount
      const isAchieved = newAmount >= goalData.target_amount

      await supabase
        .from('savings_goals')
        .update({
          current_amount: newAmount,
          status: isAchieved ? 'achieved' : 'active',
        })
        .eq('id', contribution.goal_id)
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'verify_deposit',
      entity_type: 'savings_contributions',
      entity_id: contribution.id,
      details: { amount: contribution.amount, goal_id: contribution.goal_id },
    })

    // Send notification to partner
    await supabase.from('notifications').insert({
      user_id: contribution.user_id,
      type: 'contribution_verified',
      title: 'Setoran Diverifikasi Bendahara! 🎉',
      message: `Setoran sebesar ${formatRupiah(contribution.amount)} telah diverifikasi oleh Bendahara (${profile?.full_name || 'Thania'}).`,
      reference_id: contribution.id,
      reference_type: 'savings_contributions',
      is_read: false,
    })

    setActionLoading(false)
    toast.success(`Setoran ${formatRupiah(contribution.amount)} berhasil diverifikasi!`)
    fetchTreasurerData()
  }

  // Reject deposit / expense
  const handleConfirmReject = async () => {
    if (!rejectItem) return
    if (!rejectReason.trim()) {
      toast.error('Harap isi alasan penolakan.')
      return
    }

    setActionLoading(true)

    if (rejectItem.type === 'deposit') {
      const { error } = await supabase
        .from('savings_contributions')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason.trim(),
          verified_by: user!.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', rejectItem.id)

      if (error) {
        setActionLoading(false)
        toast.error('Gagal menolak: ' + error.message)
        return
      }

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'reject_deposit',
        entity_type: 'savings_contributions',
        entity_id: rejectItem.id,
        details: { reason: rejectReason.trim() },
      })

      toast.success('Setoran ditolak.')
    } else {
      const { error } = await supabase
        .from('expense_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason.trim(),
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', rejectItem.id)

      if (error) {
        setActionLoading(false)
        toast.error('Gagal menolak pengeluaran: ' + error.message)
        return
      }

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'reject_expense',
        entity_type: 'expense_requests',
        entity_id: rejectItem.id,
        details: { reason: rejectReason.trim() },
      })

      toast.success('Pengajuan pengeluaran ditolak.')
    }

    setActionLoading(false)
    setRejectItem(null)
    setRejectReason('')
    fetchTreasurerData()
  }

  // Approve expense
  const handleApproveExpense = async (expense: any) => {
    setActionLoading(true)

    // Check if goal has enough balance
    if (expense.goal_id) {
      const { data: goalData } = await supabase
        .from('savings_goals')
        .select('current_amount')
        .eq('id', expense.goal_id)
        .single()

      if (goalData && goalData.current_amount < expense.amount) {
        setActionLoading(false)
        toast.error('Saldo target tabungan tidak mencukupi untuk pengeluaran ini.')
        return
      }

      if (goalData) {
        await supabase
          .from('savings_goals')
          .update({
            current_amount: goalData.current_amount - expense.amount,
          })
          .eq('id', expense.goal_id)
      }
    }

    const { error } = await supabase
      .from('expense_requests')
      .update({
        status: 'approved',
        approved_by: user!.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', expense.id)

    if (error) {
      setActionLoading(false)
      toast.error('Gagal menyetujui: ' + error.message)
      return
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'approve_expense',
      entity_type: 'expense_requests',
      entity_id: expense.id,
      details: { amount: expense.amount, goal_id: expense.goal_id },
    })

    // Send notification to requester
    await supabase.from('notifications').insert({
      user_id: expense.requested_by,
      type: 'expense_approved',
      title: 'Pengeluaran Disetujui Bendahara! 💸',
      message: `Pengeluaran ${formatRupiah(expense.amount)} untuk "${expense.reason}" telah disetujui.`,
      reference_id: expense.id,
      reference_type: 'expense_requests',
      is_read: false,
    })

    setActionLoading(false)
    toast.success(`Pengeluaran ${formatRupiah(expense.amount)} berhasil disetujui!`)
    fetchTreasurerData()
  }

  const netCash = totalVerifiedSavings - totalApprovedExpenses

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 mb-2">
            <ShieldCheck size={14} />
            Ruang Khusus Bendahara Umum
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Panel Bendahara — Thania Al Zahra
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Verifikasi setoran harian, kelola kas bersama, dan persetujuan pengeluaran dana.
          </p>
        </div>
      </div>

      {/* Treasury Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Kas Bersih */}
        <div className="card-static p-5 bg-gradient-to-br from-coffee-700 to-coffee-900 text-white rounded-2xl">
          <div className="flex items-center justify-between text-cream-200 text-xs mb-1">
            <span>Sisa Kas Riil Bersama</span>
            <Wallet size={18} />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {formatRupiah(netCash)}
          </div>
          <div className="text-[11px] text-cream-300/80 mt-2">
            Uang fisik / saldo rekening yang dipegang Bendahara
          </div>
        </div>

        {/* Total Setoran Masuk */}
        <div className="card-static p-5 border-l-4 border-emerald-600">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span>Total Setoran Terverifikasi</span>
            <ArrowDownLeft size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {formatRupiah(totalVerifiedSavings)}
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            Dari seluruh setoran yang sudah lolos validasi
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="card-static p-5 border-l-4 border-burgundy-600">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span>Total Pengeluaran Disetujui</span>
            <ArrowUpRight size={18} className="text-burgundy-600" />
          </div>
          <div className="text-2xl font-bold text-burgundy-800">
            {formatRupiah(totalApprovedExpenses)}
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            Penggunaan dana untuk realisasi goals
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'deposits'
              ? 'border-coffee-600 text-coffee-800 font-semibold'
              : 'border-transparent text-gray-500 hover:text-coffee-600'
          }`}
        >
          <ArrowDownLeft size={16} />
          Verifikasi Setoran ({pendingDeposits.length})
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'border-coffee-600 text-coffee-800 font-semibold'
              : 'border-transparent text-gray-500 hover:text-coffee-600'
          }`}
        >
          <ArrowUpRight size={16} />
          Persetujuan Pengeluaran ({pendingExpenses.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-coffee-600 text-coffee-800 font-semibold'
              : 'border-transparent text-gray-500 hover:text-coffee-600'
          }`}
        >
          <FileText size={16} />
          Audit Log Aktivitas
        </button>
      </div>

      {/* Tab 1: Pending Deposits */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <div className="card-static p-4 bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <BadgeAlert size={18} className="shrink-0 text-amber-700" />
            <span>
              Pastikan uang fisik (celengan/amplop) atau transfer rekening sudah benar-benar kamu terima sebelum menekan tombol verifikasi.
            </span>
          </div>

          <div className="card-static overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-coffee-200 border-t-coffee-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Memuat antrean setoran...</p>
              </div>
            ) : pendingDeposits.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-2">
                <CheckCircle size={40} className="mx-auto text-emerald-400 opacity-60" />
                <h4 className="font-semibold text-gray-700">Semua Setoran Beres!</h4>
                <p className="text-xs">Tidak ada setoran yang menunggu verifikasi saat ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingDeposits.map((item) => (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-coffee-800">
                          +{formatRupiah(item.amount)}
                        </span>
                        <span className="badge text-xs bg-amber-50 text-amber-700 border border-amber-200">
                          Menunggu Konfirmasi
                        </span>
                      </div>

                      <div className="text-xs text-gray-600">
                        Penyetor: <strong className="text-gray-800">{item.profiles?.full_name || 'Partner'}</strong> ({item.profiles?.email})
                      </div>

                      <div className="text-xs text-gray-500">
                        Untuk Target: <strong className="text-gray-700">{item.savings_goals?.name || 'Tabungan Bersama'}</strong>
                      </div>

                      <div className="text-[11px] text-gray-400">
                        Diajukan pada: {formatDateTime(item.created_at)}
                      </div>

                      {item.notes && (
                        <div className="text-xs italic text-gray-500 pt-1">
                          Catatan: "{item.notes}"
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => setRejectItem({ id: item.id, type: 'deposit' })}
                        className="btn-secondary text-xs py-2 px-3 text-red-600 hover:bg-red-50 border-red-200"
                        disabled={actionLoading}
                      >
                        <XCircle size={15} />
                        Tolak
                      </button>

                      <button
                        onClick={() => handleVerifyDeposit(item)}
                        className="btn-success text-xs py-2 px-4 shadow-xs"
                        disabled={actionLoading}
                      >
                        <CheckCircle size={15} />
                        Verifikasi Dana Masuk
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Pending Expenses */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="card-static p-4 bg-cream-100 border border-cream-200 text-xs text-coffee-800 flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0 text-coffee-700" />
            <span>
              Persetujuan pengeluaran akan otomatis mengurangi saldo target tabungan terkait dan memotong saldo kas bersama.
            </span>
          </div>

          <div className="card-static overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-coffee-200 border-t-coffee-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Memuat pengajuan pengeluaran...</p>
              </div>
            ) : pendingExpenses.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-2">
                <CheckCircle size={40} className="mx-auto text-emerald-400 opacity-60" />
                <h4 className="font-semibold text-gray-700">Tidak Ada Pengajuan</h4>
                <p className="text-xs">Tidak ada permohonan pengeluaran dana yang tertunda.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingExpenses.map((exp) => (
                  <div key={exp.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-burgundy-700">
                          -{formatRupiah(exp.amount)}
                        </span>
                        <span className="badge text-xs bg-amber-50 text-amber-700 border border-amber-200">
                          Menunggu Persetujuan
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-gray-800">
                        Keperluan: {exp.reason}
                      </div>

                      <div className="text-xs text-gray-600">
                        Diajukan oleh: <strong className="text-gray-800">{exp.profiles?.full_name || 'Partner'}</strong>
                      </div>

                      {exp.savings_goals?.name && (
                        <div className="text-xs text-gray-500">
                          Dari Target: <strong className="text-gray-700">{exp.savings_goals.name}</strong>
                        </div>
                      )}

                      <div className="text-[11px] text-gray-400">
                        Tanggal pengajuan: {formatDateTime(exp.created_at)}
                      </div>

                      {exp.notes && (
                        <div className="text-xs italic text-gray-500 pt-1">
                          Catatan: "{exp.notes}"
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => setRejectItem({ id: exp.id, type: 'expense' })}
                        className="btn-secondary text-xs py-2 px-3 text-red-600 hover:bg-red-50 border-red-200"
                        disabled={actionLoading}
                      >
                        <XCircle size={15} />
                        Tolak
                      </button>

                      <button
                        onClick={() => handleApproveExpense(exp)}
                        className="btn-primary text-xs py-2 px-4"
                        disabled={actionLoading}
                      >
                        <CheckCircle size={15} />
                        Setujui Pengeluaran
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="card-static p-6 space-y-4">
          <h3 className="font-semibold text-base text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
            Log Transparansi & Rekam Jejak Keamanan
          </h3>
          <p className="text-xs text-gray-500">
            Setiap aksi penting (verifikasi, approval, penolakan) tersimpan secara permanen untuk menjaga kejujuran dan saling percaya.
          </p>

          <div className="divide-y divide-gray-100 mt-4">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">Belum ada riwayat audit log.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-700 uppercase">
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="text-gray-500">{log.entity_type}</span>
                    {log.details && (
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400 text-[11px] shrink-0 pl-3">
                    {formatDateTime(log.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="card-static w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-700 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <XCircle size={20} />
              Konfirmasi Penolakan
            </h3>
            <p className="text-xs text-gray-600">
              Tuliskan alasan penolakan secara jelas agar pasangan memahaminya (misal: "Uang belum masuk ke rekening", "Nominal tidak sesuai bukti transfer").
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Tulis alasan penolakan di sini..."
              rows={3}
              className="input-field text-sm resize-none"
              autoFocus
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectItem(null)}
                className="btn-secondary text-xs py-2 px-3"
                disabled={actionLoading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="btn-danger text-xs py-2 px-4"
                disabled={actionLoading}
              >
                {actionLoading ? 'Memproses...' : 'Tolak Transaksi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
