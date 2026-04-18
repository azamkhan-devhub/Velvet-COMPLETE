'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Check, X, ArrowRight } from 'lucide-react';
import { getDocs, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { returnsCol } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/client';
import { ReturnRequest } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-500/10 text-yellow-400',
  approved:  'bg-green-500/10 text-green-400',
  rejected:  'bg-red-500/10 text-red-400',
  completed: 'bg-blue-500/10 text-blue-400',
};

export default function AdminReturnsPage() {
  const [returns,  setReturns]  = useState<ReturnRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [adminNote,setAdminNote]= useState('');

  useEffect(() => {
    getDocs(query(returnsCol, orderBy('createdAt','desc')))
      .then(snap => { setReturns(snap.docs.map(d=>({id:d.id,...d.data()}as ReturnRequest))); setLoading(false); });
  }, []);

  const updateStatus = async (ret: ReturnRequest, status: ReturnRequest['status']) => {
    await updateDoc(doc(db,'returns',ret.id), {
      status, adminNotes: adminNote, resolvedAt: serverTimestamp(),
    });
    // If approved, also update order
    if (status === 'approved') {
      await updateDoc(doc(db,'orders',ret.orderId), { status:'returned', updatedAt:serverTimestamp() });
    }
    setReturns(rs => rs.map(r => r.id===ret.id ? {...r,status} : r));
    setSelected(null); setAdminNote('');
    toast.success(`Return ${status}`);
  };

  const filtered = returns.filter(r => filter==='all' || r.status===filter);

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-light text-admin-text">Returns & Refunds</h1>
        <p className="text-admin-muted text-sm mt-1">{returns.filter(r=>r.status==='pending').length} pending requests</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all','pending','approved','rejected','completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[11px] tracking-wider uppercase px-3 py-2 rounded-lg border transition-colors ${filter===f ? 'bg-gold text-black border-gold' : 'border-admin-border text-admin-muted hover:text-admin-text'}`}>
            {f} {f!=='all' && `(${returns.filter(r=>r.status===f).length})`}
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-admin-surface border border-admin-border w-full max-w-lg p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-admin-text font-medium">Return Request</h3>
              <button onClick={() => setSelected(null)}><X size={18} className="text-admin-muted" /></button>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-admin-muted">Customer</span><span className="text-admin-text">{selected.userEmail}</span></div>
              <div className="flex justify-between"><span className="text-admin-muted">Order</span>
                <Link href={`/admin/orders/${selected.orderId}`} className="text-gold hover:text-gold-light">{selected.orderId.slice(0,12)}…</Link>
              </div>
              <div className="flex justify-between"><span className="text-admin-muted">Reason</span><span className="text-admin-text">{selected.reason}</span></div>
              <div className="flex justify-between"><span className="text-admin-muted">Refund Amount</span><span className="text-admin-text font-medium">{formatPrice(selected.refundAmount)}</span></div>
            </div>
            <div>
              <p className="text-[10px] text-admin-muted uppercase tracking-wider mb-2">Customer description</p>
              <p className="text-sm text-admin-text bg-admin-bg p-3 rounded-lg">{selected.description}</p>
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Admin Notes (sent to customer)</label>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
                className="admin-input resize-none" placeholder="Reason for approval or rejection…" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => updateStatus(selected,'approved')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-xs tracking-wider uppercase rounded hover:bg-green-500 transition-colors">
                <Check size={13} /> Approve & Refund
              </button>
              <button onClick={() => updateStatus(selected,'rejected')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white text-xs tracking-wider uppercase rounded hover:bg-red-500 transition-colors">
                <X size={13} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-admin-surface rounded-xl animate-pulse"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="admin-card text-center py-16">
          <RotateCcw size={40} className="text-admin-muted mx-auto mb-4" />
          <p className="text-admin-text font-display text-xl font-light">No return requests</p>
        </div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                {['Customer','Order','Reason','Items','Refund Amount','Date','Status','Actions'].map(h => (
                  <th key={h} className="text-left pb-3 text-[10px] uppercase tracking-wider text-admin-muted font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ret => (
                <tr key={ret.id} className="admin-table-row">
                  <td className="py-3 pr-4 text-admin-text text-xs">{ret.userEmail}</td>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/orders/${ret.orderId}`} className="text-gold hover:text-gold-light text-xs font-mono">
                      {ret.orderId.slice(0,10)}…
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-admin-muted text-xs max-w-[140px] truncate">{ret.reason}</td>
                  <td className="py-3 pr-4 text-admin-muted">{ret.items?.length || 0}</td>
                  <td className="py-3 pr-4 text-admin-text font-medium">{formatPrice(ret.refundAmount)}</td>
                  <td className="py-3 pr-4 text-admin-muted text-xs">{ret.createdAt ? formatDate(ret.createdAt as any) : '—'}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full ${STATUS_COLORS[ret.status]}`}>
                      {ret.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {ret.status === 'pending' && (
                      <button onClick={() => { setSelected(ret); setAdminNote(''); }}
                        className="flex items-center gap-1.5 text-[11px] text-gold hover:text-gold-light transition-colors uppercase tracking-wider">
                        Review <ArrowRight size={11} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
