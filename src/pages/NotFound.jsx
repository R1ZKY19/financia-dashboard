import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-bg">
      <CompassIcon className="h-10 w-10 text-accent mb-4" />
      <h1 className="text-xl font-bold text-ink">Halaman tidak ditemukan</h1>
      <p className="text-sm text-ink-soft mt-1 mb-5">Halaman yang Anda cari tidak tersedia atau telah dipindahkan.</p>
      <Link to="/dashboard" className="btn-primary">Kembali ke Dashboard</Link>
    </div>
  );
}
