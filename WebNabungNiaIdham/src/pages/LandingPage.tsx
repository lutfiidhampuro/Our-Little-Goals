import { Link } from 'react-router-dom'
import { Heart, PiggyBank, Target, Calendar, Shield, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: PiggyBank,
    title: 'Tabungan Bersama',
    desc: 'Tetapkan tujuan menabung bersama pasangan dan pantau progres secara real-time.',
  },
  {
    icon: Heart,
    title: 'Wishlist Pribadi',
    desc: 'Simpan keinginan pribadimu dan tabung secara mandiri tanpa mengganggu tabungan bersama.',
  },
  {
    icon: Target,
    title: 'Tracking Progres',
    desc: 'Lihat seberapa dekat tujuan kalian tercapai dengan progress bar visual yang menarik.',
  },
  {
    icon: Calendar,
    title: 'Pengingat Harian',
    desc: 'Notifikasi menabung setiap hari kerja untuk membangun kebiasaan menabung yang konsisten.',
  },
  {
    icon: Shield,
    title: 'Bendahara Terpercaya',
    desc: 'Satu pihak mengelola dan memverifikasi setiap setoran tabungan bersama agar tetap aman.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm" style={{ background: 'rgba(255,253,247,0.9)', borderBottom: '1px solid var(--color-border-light)' }}>
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-coffee-700)' }}>
            Our Little Goals
          </h1>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm !py-2 !px-4">
              Masuk
            </Link>
            <Link to="/register" className="btn-primary text-sm !py-2 !px-4">
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm animate-fade-in-up"
            style={{ background: 'var(--color-cream-200)', color: 'var(--color-coffee-600)' }}>
            <Heart size={14} /> Platform Menabung untuk Pasangan
          </div>

          <h2
            className="text-4xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in-up-delay-1"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-coffee-800)' }}
          >
            Small Savings,{' '}
            <span style={{ color: 'var(--color-burgundy-500)' }}>Big Memories.</span>
          </h2>

          <p
            className="text-lg lg:text-xl mb-10 max-w-xl mx-auto animate-fade-in-up-delay-2"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Menabung berdua untuk tujuan bersama, sambil tetap punya ruang untuk wishlist pribadi masing-masing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-delay-3">
            <Link to="/register" className="btn-primary text-base !py-3 !px-8">
              Mulai Menabung <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base !py-3 !px-8">
              Sudah Punya Akun
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4" style={{ background: 'var(--color-cream-100)' }}>
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl lg:text-3xl font-semibold text-center mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Bagaimana Cara Kerjanya?
          </h3>
          <p className="text-center mb-12" style={{ color: 'var(--color-text-secondary)' }}>
            Tiga langkah sederhana untuk memulai perjalanan menabung bersama.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Buat Akun & Undang Pasangan', desc: 'Daftar akun dan hubungkan dengan pasanganmu melalui kode undangan unik.' },
              { step: '2', title: 'Tetapkan Tujuan', desc: 'Tambahkan tujuan menabung bersama — liburan, hadiah, atau apapun impian kalian.' },
              { step: '3', title: 'Mulai Menabung', desc: 'Setoran harian Rp5.000–Rp20.000, diverifikasi bendahara, dan pantau progresnya.' },
            ].map((item) => (
              <div key={item.step} className="card-static p-6 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold text-white"
                  style={{ background: 'var(--color-coffee-600)' }}
                >
                  {item.step}
                </div>
                <h4 className="font-semibold mb-2 text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                  {item.title}
                </h4>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl lg:text-3xl font-semibold text-center mb-12" style={{ fontFamily: 'var(--font-heading)' }}>
            Fitur Unggulan
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-cream-200)', color: 'var(--color-coffee-600)' }}
                >
                  <f.icon size={20} />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  {f.title}
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 px-4" style={{ background: 'var(--color-cream-100)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            ⚠️ Our Little Goals berfungsi sebagai alat pencatatan dan perencanaan tabungan. Website ini tidak menyimpan uang secara digital, tidak terhubung dengan rekening bank, dan tidak melakukan transfer dana. Seluruh dana fisik dikelola secara mandiri oleh pemilik akun sesuai kesepakatan bersama.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center" style={{ background: 'linear-gradient(135deg, #6F4E37 0%, #3E2723 100%)' }}>
        <h3 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          Siap Memulai Perjalanan Menabung?
        </h3>
        <p className="text-cream-200/80 mb-8 max-w-lg mx-auto">
          Bergabung sekarang dan mulai menabung bersama pasanganmu untuk masa depan yang lebih indah.
        </p>
        <Link to="/register" className="btn-primary !bg-white !text-coffee-700 text-base !py-3 !px-8">
          Daftar Gratis <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t" style={{ borderColor: 'var(--color-border-light)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          © 2026 Our Little Goals — Dibuat dengan 💕 oleh Lutfi & Thania
        </p>
      </footer>
    </div>
  )
}
