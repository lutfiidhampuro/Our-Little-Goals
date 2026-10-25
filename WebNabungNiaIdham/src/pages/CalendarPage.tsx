import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import {
  formatRupiah,
  isWeekday,
  formatDate,
  type DailySavingActivity,
  type SavingsContribution,
} from '../lib/types'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Heart,
  Clock,
  Sparkles,
} from 'lucide-react'

export default function CalendarPage() {
  const { user, couple } = useAuthStore()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [activities, setActivities] = useState<Record<string, { count: number; total: number; verified: boolean }>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0])
  const [selectedDateContributions, setSelectedDateContributions] = useState<any[]>([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of current month & number of days
  const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sunday
  const totalDays = new Date(year, month + 1, 0).getDate()
  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (couple) {
      fetchMonthlyData()
    }
  }, [couple, year, month])

  useEffect(() => {
    if (selectedDate && couple) {
      fetchDateDetails(selectedDate)
    }
  }, [selectedDate, couple])

  const fetchMonthlyData = async () => {
    if (!couple) return
    setLoading(true)

    const startOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00Z`
    const endOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}T23:59:59Z`

    // Fetch contributions in this month
    const { data } = await supabase
      .from('savings_contributions')
      .select('id, amount, status, created_at, user_id')
      .eq('couple_id', couple.id)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)

    const actMap: Record<string, { count: number; total: number; verified: boolean }> = {}

    if (data) {
      data.forEach((c) => {
        const dateKey = c.created_at.split('T')[0]
        if (!actMap[dateKey]) {
          actMap[dateKey] = { count: 0, total: 0, verified: false }
        }
        actMap[dateKey].count += 1
        actMap[dateKey].total += c.amount
        if (c.status === 'verified') actMap[dateKey].verified = true
      })
    }

    setActivities(actMap)

    // Calculate current streak
    calculateStreak()
    setLoading(false)
  }

  const calculateStreak = async () => {
    if (!couple) return

    // Query recent distinct dates with contributions
    const { data } = await supabase
      .from('savings_contributions')
      .select('created_at')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
      .limit(60)

    if (!data || data.length === 0) {
      setStreak(0)
      return
    }

    const savedDates = new Set(data.map((d) => d.created_at.split('T')[0]))
    let currentStreak = 0
    const checkDate = new Date()

    // Check today or yesterday
    const todayStr = checkDate.toISOString().split('T')[0]
    if (!savedDates.has(todayStr)) {
      // Check if yesterday had a contribution
      checkDate.setDate(checkDate.getDate() - 1)
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      const dayOfWeek = checkDate.getDay()

      // If weekend, skip weekend without breaking streak
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        checkDate.setDate(checkDate.getDate() - 1)
        continue
      }

      if (savedDates.has(dateStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    setStreak(currentStreak)
  }

  const fetchDateDetails = async (dateStr: string) => {
    if (!couple) return
    const start = `${dateStr}T00:00:00Z`
    const end = `${dateStr}T23:59:59Z`

    const { data } = await supabase
      .from('savings_contributions')
      .select('*, profiles:user_id(full_name, avatar_url), savings_goals:goal_id(name)')
      .eq('couple_id', couple.id)
      .gte('created_at', start)
      .lte('created_at', end)

    if (data) {
      setSelectedDateContributions(data)
    } else {
      setSelectedDateContributions([])
    }
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today.toISOString().split('T')[0])
  }

  // Monthly statistics
  let weekdaysCount = 0
  let savedDaysCount = 0
  let totalSavedMonth = 0

  for (let d = 1; d <= totalDays; d++) {
    const testDate = new Date(year, month, d)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (isWeekday(testDate)) {
      weekdaysCount++
      if (activities[dateStr]) {
        savedDaysCount++
      }
    }
    if (activities[dateStr]) {
      totalSavedMonth += activities[dateStr].total
    }
  }

  const complianceRate = weekdaysCount > 0 ? Math.round((savedDaysCount / weekdaysCount) * 100) : 0

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <CalendarIcon className="text-coffee-600" size={26} />
            Kalender & Habit Menabung
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Komitmen harian (Senin - Jumat) untuk masa depan berdua yang lebih bahagia
          </p>
        </div>

        <button onClick={goToToday} className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto">
          Hari Ini
        </button>
      </div>

      {/* Streak and Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak */}
        <div className="card-static p-4 flex items-center gap-3.5 bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Flame size={28} className={streak > 0 ? 'animate-bounce' : ''} />
          </div>
          <div>
            <span className="text-xs text-amber-800/80 font-medium block">Current Habit Streak</span>
            <div className="text-2xl font-extrabold text-amber-900">
              {streak} <span className="text-sm font-semibold">Hari Berturut-turut</span>
            </div>
            <span className="text-[11px] text-amber-700/70">
              {streak >= 5 ? 'Luar biasa! Disiplin kalian hebat! 🔥' : 'Ayo konsisten setiap hari kerja! ✨'}
            </span>
          </div>
        </div>

        {/* Monthly Saved */}
        <div className="card-static p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-coffee-100 flex items-center justify-center text-coffee-700">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium block">Terkumpul Bulan Ini</span>
            <div className="text-xl font-bold text-coffee-800">
              {formatRupiah(totalSavedMonth)}
            </div>
            <span className="text-[11px] text-gray-400">
              {savedDaysCount} hari aktif menabung
            </span>
          </div>
        </div>

        {/* Consistency rate */}
        <div className="card-static p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium block">Kepatuhan Jadwal</span>
            <div className="text-xl font-bold text-emerald-700">
              {complianceRate}%
            </div>
            <span className="text-[11px] text-gray-400">
              {savedDaysCount} dari {weekdaysCount} hari kerja
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card-static p-6 space-y-4">
          {/* Calendar Month Navigation */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 capitalize" style={{ fontFamily: 'var(--font-heading)' }}>
              {monthName}
            </h2>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Bulan sebelumnya"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Bulan berikutnya"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-gray-400 py-2 border-b border-gray-100">
            {dayNames.map((d, i) => (
              <div key={d} className={i === 0 || i === 6 ? 'text-amber-600/70' : ''}>
                {d}
              </div>
            ))}
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots for start offset */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 sm:h-20 rounded-xl bg-gray-50/40" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1
              const dateObj = new Date(year, month, dayNum)
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              const isToday = new Date().toISOString().split('T')[0] === dateStr
              const isSelected = selectedDate === dateStr
              const isWorkingDay = isWeekday(dateObj)
              const activity = activities[dateStr]
              const hasSaved = Boolean(activity && activity.count > 0)

              // Determine style
              let bgClass = 'bg-white hover:bg-cream-100 border-gray-100'
              if (hasSaved) {
                bgClass = 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100 text-emerald-900'
              } else if (isWorkingDay && dateObj < new Date() && !isToday) {
                // Missed day
                bgClass = 'bg-red-50/50 border-red-100 hover:bg-red-100/60 text-red-700'
              } else if (!isWorkingDay) {
                // Weekend
                bgClass = 'bg-cream-50/60 border-cream-100/70 text-gray-400'
              }

              if (isSelected) {
                bgClass += ' ring-2 ring-coffee-600'
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-16 sm:h-20 p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all relative cursor-pointer ${bgClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? 'bg-coffee-600 text-white font-bold'
                          : hasSaved
                          ? 'text-emerald-800'
                          : 'text-gray-700'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {hasSaved && (
                      <span className="text-[10px] text-emerald-600 font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  {hasSaved ? (
                    <div className="text-[10px] font-bold text-emerald-700 truncate">
                      {formatRupiah(activity.total)}
                    </div>
                  ) : isWorkingDay && dateObj < new Date() && !isToday ? (
                    <div className="text-[9px] text-red-400">Terlewat</div>
                  ) : !isWorkingDay ? (
                    <div className="text-[9px] text-amber-600/60">Libur</div>
                  ) : null}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-gray-500 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Sudah Menabung</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-300" />
              <span>Hari Kerja Terlewat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cream-300" />
              <span>Weekend (Istirahat)</span>
            </div>
          </div>
        </div>

        {/* Detail for selected date */}
        <div className="card-static p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-100 pb-3 mb-4">
              <span className="text-xs text-gray-400 block font-medium">Detail Tanggal</span>
              <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
                {selectedDate ? formatDate(selectedDate) : 'Pilih tanggal'}
              </h3>
            </div>

            {selectedDateContributions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 space-y-2">
                <Clock size={32} className="mx-auto opacity-40" />
                <p className="text-xs">
                  Tidak ada catatan setoran tabungan pada tanggal ini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateContributions.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl border border-gray-100 bg-cream-50/50 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800">
                        {c.profiles?.full_name || 'Partner'}
                      </span>
                      <span className="badge text-[10px] bg-emerald-50 text-emerald-700">
                        {c.status}
                      </span>
                    </div>

                    <div className="text-base font-bold text-coffee-800">
                      +{formatRupiah(c.amount)}
                    </div>

                    <div className="text-[11px] text-gray-500">
                      Tujuan: {c.savings_goals?.name || 'Tabungan Bersama'}
                    </div>

                    {c.notes && (
                      <div className="text-[11px] italic text-gray-400 pt-1">
                        "{c.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Couple Romantic Habit Tip */}
          <div className="p-4 rounded-xl bg-pink-50/70 border border-pink-200/60 mt-4 text-xs text-pink-900 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-pink-950">
              <Heart size={14} className="text-pink-600 fill-pink-500" />
              Tips Menabung Bersama
            </div>
            <p className="text-[11px] text-pink-800">
              "Menabung Rp 5.000 atau Rp 20.000 setiap hari kerja lebih berharga daripada nominal besar yang jarang. Kuncinya ada di kebersamaan dan konsistensi kalian berdua."
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
