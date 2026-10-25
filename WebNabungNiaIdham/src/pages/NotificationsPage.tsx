import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { formatDateTime, type Notification } from '../lib/types'
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  Gift,
  ArrowUpRight,
  Sparkles,
  Check,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, filter])

  const fetchNotifications = async () => {
    if (!user) return
    setLoading(true)

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (filter === 'unread') {
      query = query.eq('is_read', false)
    }

    const { data } = await query
    if (data) setNotifications(data)
    setLoading(false)
  }

  const handleMarkAsRead = async (id: string, refType?: string | null, refId?: string | null) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )

    if (refType === 'savings_goals' && refId) {
      navigate(`/tabungan/${refId}`)
    } else if (refType === 'personal_wishlists' && refId) {
      navigate(`/wishlist/${refId}`)
    } else if (refType === 'expense_requests') {
      navigate('/bendahara')
    }
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      toast.error('Gagal menandai notifikasi: ' + error.message)
      return
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    toast.success('Semua notifikasi ditandai telah dibaca.')
  }

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    toast.success('Notifikasi dihapus.')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contribution_verified':
        return <CheckCircle2 className="text-emerald-600" size={20} />
      case 'contribution_new':
        return <PiggyBank className="text-coffee-600" size={20} />
      case 'contribution_rejected':
      case 'expense_rejected':
        return <AlertCircle className="text-burgundy-600" size={20} />
      case 'expense_request':
      case 'expense_approved':
        return <ArrowUpRight className="text-amber-600" size={20} />
      case 'goal_achieved':
        return <Sparkles className="text-amber-500" size={20} />
      default:
        return <Bell className="text-coffee-600" size={20} />
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Bell className="text-coffee-600" size={26} />
            Notifikasi
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Pemberitahuan aktivitas setoran, verifikasi, dan pencapaian target kalian
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Check size={14} />
            Tandai Semua Sudah Dibaca
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            filter === 'all'
              ? 'border-coffee-600 text-coffee-800 font-semibold'
              : 'border-transparent text-gray-500 hover:text-coffee-600'
          }`}
        >
          Semua Notifikasi ({notifications.length})
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            filter === 'unread'
              ? 'border-coffee-600 text-coffee-800 font-semibold'
              : 'border-transparent text-gray-500 hover:text-coffee-600'
          }`}
        >
          Belum Dibaca ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="card-static overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-coffee-200 border-t-coffee-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Memuat notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <Bell size={40} className="mx-auto opacity-30" />
            <h4 className="font-semibold text-gray-700">Tidak Ada Notifikasi</h4>
            <p className="text-xs">
              {filter === 'unread' ? 'Semua notifikasi sudah kamu baca.' : 'Belum ada notifikasi aktivitas baru.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id, item.reference_type, item.reference_id)}
                className={`p-4 sm:p-5 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                  !item.is_read ? 'bg-cream-100/70 hover:bg-cream-200/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-gray-800">
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-burgundy-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="text-[11px] text-gray-400 pt-0.5">
                      {formatDateTime(item.created_at)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteNotification(item.id, e)}
                  className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg transition-colors shrink-0"
                  title="Hapus notifikasi"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
