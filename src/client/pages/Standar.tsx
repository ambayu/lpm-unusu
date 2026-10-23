import React, { useEffect, useState } from 'react';
import { fetchStandar, StandarItem } from '../services/api';
import { Award, CheckCircle2, BookOpen, Layers } from 'lucide-react';

export const StandarPage: React.FC = () => {
  const [standarList, setStandarList] = useState<StandarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandar()
      .then((res) => setStandarList(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-yellow-300 px-3 py-1 rounded-full">
          Siklus Mutu PPEPP
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">Sistem Penjaminan Mutu Internal (SPMI)</h1>
        <p className="text-emerald-100 text-sm mt-1 max-w-2xl leading-relaxed">
          Mengawal standar mutu akademik dan non-akademik di lingkungan UNUSU agar selaras dengan Permendikbudristek dan tradisi mutu perguruan tinggi NU.
        </p>
      </div>

      {/* Standar List */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Daftar Standar Mutu Pendidikan & Riset</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {standarList.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {s.kode}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                  {s.kategori}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{s.nama}</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{s.pernyataan}"
              </p>
              {s.indikator && (
                <div className="text-xs text-slate-500">
                  <strong>Indikator Kunci:</strong> {s.indikator}
                </div>
              )}
              {s.target && (
                <div className="text-xs font-bold text-emerald-700">
                  Target Mutu: {s.target}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
