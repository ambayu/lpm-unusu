import React, { useEffect, useState } from 'react';
import { fetchDokumenMutu, DokumenMutuItem } from '../services/api';
import { FileText, Download, CheckCircle2 } from 'lucide-react';

export const DokumenPage: React.FC = () => {
  const [docs, setDocs] = useState<DokumenMutuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDokumenMutu()
      .then((res) => setDocs(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Buku Kebijakan, Manual & SOP Mutu</h1>
        <p className="text-xs text-slate-500 mt-1">Dokumen acuan penetapan dan pelaksanaan standar operasional prosedur penjaminan mutu kampus.</p>
      </div>

      <div className="space-y-3">
        {docs.map((d) => (
          <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-500">{d.kodeDokumen}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{d.jenis}</span>
                  <span className="text-[10px] text-slate-400">Revisi {d.revisi}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{d.judul}</h3>
              </div>
            </div>
            <button
              onClick={() => alert(`Mengunduh dokumen: ${d.judul}`)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-xs font-bold text-slate-700 hover:text-emerald-800 transition"
            >
              Unduh Dokumen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
