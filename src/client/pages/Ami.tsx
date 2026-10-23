import React, { useEffect, useState } from 'react';
import { fetchAudit, AuditItem } from '../services/api';
import { CheckSquare, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

export const AmiPage: React.FC = () => {
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudit()
      .then((res) => setAudits(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Audit Mutu Internal (AMI)</h1>
        <p className="text-xs text-slate-500 mt-1">Laporan siklus audit kepatuhan standar mutu akademik dan non-akademik di tingkat program studi & fakultas.</p>
      </div>

      <div className="space-y-4">
        {audits.map((a) => (
          <div key={a.id} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400">{a.periode?.nama}</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Auditee: {a.auditee}</h3>
                <p className="text-xs text-slate-500">Auditor: <strong>{a.auditor}</strong> • Standar: {a.standar?.nama}</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {a.hasil}
              </span>
            </div>

            {a.deskripsi && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {a.deskripsi}
              </p>
            )}

            {a.rekomendasi && (
              <div className="text-xs text-slate-700 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                <strong>Rekomendasi Tindak Lanjut:</strong> {a.rekomendasi}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
