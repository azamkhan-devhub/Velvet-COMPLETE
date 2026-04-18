'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, X, Copy } from 'lucide-react';
import { getDocs, query, orderBy, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { couponsCol } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Coupon } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const [coupons,  setCoupons]  = useState<Coupon[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code:'', description:'', discountType:'percentage', discountValue:10,
      minOrderAmount:0, maxDiscountAmount:'', usageLimit:100,
      validFrom: new Date().toISOString().slice(0,16),
      validUntil: new Date(Date.now()+30*86400000).toISOString().slice(0,16),
    }
  });

  const load = () => {
    getDocs(query(couponsCol, orderBy('createdAt','desc')))
      .then(snap => { setCoupons(snap.docs.map(d=>({id:d.id,...d.data()}as Coupon))); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      await addDoc(couponsCol, {
        ...data,
        code: data.code.toUpperCase().trim(),
        discountValue: Number(data.discountValue),
        minOrderAmount: Number(data.minOrderAmount),
        maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
        usageLimit: Number(data.usageLimit),
        usedCount: 0,
        isActive: true,
        validFrom: Timestamp.fromDate(new Date(data.validFrom)),
        validUntil: Timestamp.fromDate(new Date(data.validUntil)),
        createdAt: serverTimestamp(),
      });
      toast.success('Coupon created!');
      reset(); setShowForm(false); load();
    } catch { toast.error('Failed to create coupon'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (coupon: Coupon) => {
    await updateDoc(doc(db,'coupons',coupon.id), { isActive: !coupon.isActive });
    setCoupons(cs => cs.map(c => c.id===coupon.id ? {...c, isActive:!c.isActive} : c));
    toast.success(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`);
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await deleteDoc(doc(db,'coupons',id));
    setCoupons(cs => cs.filter(c => c.id !== id));
    toast.success('Coupon deleted');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-light text-admin-text">Coupons</h1>
          <p className="text-admin-muted text-sm mt-1">{coupons.length} discount codes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="btn-primary bg-gold text-black hover:bg-gold-light text-xs py-2.5">
          <Plus size={14} /> Create Coupon
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="admin-card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-admin-text font-medium">New Discount Code</h2>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-admin-muted hover:text-admin-text" /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Coupon Code *</label>
              <input {...register('code',{required:true})} className="admin-input uppercase" placeholder="SUMMER20" />
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Description</label>
              <input {...register('description')} className="admin-input" placeholder="20% off summer collection" />
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Discount Type</label>
              <select {...register('discountType')} className="admin-input">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (PKR)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Discount Value *</label>
              <input {...register('discountValue',{required:true,min:1})} type="number" className="admin-input" placeholder="20" />
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Min. Order (PKR)</label>
              <input {...register('minOrderAmount')} type="number" className="admin-input" placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Max Discount (PKR, optional)</label>
              <input {...register('maxDiscountAmount')} type="number" className="admin-input" placeholder="Leave blank for no limit" />
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Usage Limit</label>
              <input {...register('usageLimit')} type="number" className="admin-input" placeholder="100" />
            </div>
            <div />
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Valid From</label>
              <input {...register('validFrom',{required:true})} type="datetime-local" className="admin-input" />
            </div>
            <div>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Valid Until</label>
              <input {...register('validUntil',{required:true})} type="datetime-local" className="admin-input" />
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary bg-gold text-black hover:bg-gold-light text-xs py-2.5">
                {saving ? 'Creating…' : 'Create Coupon'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-xs py-2.5 border-admin-border text-admin-muted hover:text-admin-text hover:border-admin-text/30">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-14 bg-admin-surface rounded-xl animate-pulse"/>)}</div>
      ) : coupons.length === 0 ? (
        <div className="admin-card text-center py-16">
          <Tag size={40} className="text-admin-muted mx-auto mb-4" />
          <p className="text-admin-text font-display text-xl font-light mb-2">No coupons yet</p>
          <button onClick={() => setShowForm(true)} className="btn-primary bg-gold text-black text-xs py-2.5 mt-2">Create First Coupon</button>
        </div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                {['Code','Description','Discount','Min. Order','Usage','Valid Until','Status','Actions'].map(h => (
                  <th key={h} className="text-left pb-3 text-[10px] uppercase tracking-wider text-admin-muted font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => {
                const pct = coupon.usageLimit > 0 ? Math.round((coupon.usedCount/coupon.usageLimit)*100) : 0;
                const expired = coupon.validUntil && (coupon.validUntil as any).toDate?.() < new Date();
                return (
                  <tr key={coupon.id} className="admin-table-row">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gold font-medium">{coupon.code}</span>
                        <button onClick={() => copyCode(coupon.code)} className="text-admin-muted hover:text-gold transition-colors"><Copy size={12}/></button>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-admin-muted text-xs max-w-[180px] truncate">{coupon.description || '—'}</td>
                    <td className="py-3 pr-4 text-admin-text font-medium">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)}
                      {coupon.maxDiscountAmount && <p className="text-[10px] text-admin-muted">Max: {formatPrice(coupon.maxDiscountAmount)}</p>}
                    </td>
                    <td className="py-3 pr-4 text-admin-muted text-xs">{coupon.minOrderAmount > 0 ? formatPrice(coupon.minOrderAmount) : 'None'}</td>
                    <td className="py-3 pr-4">
                      <div className="text-xs text-admin-muted mb-1">{coupon.usedCount} / {coupon.usageLimit}</div>
                      <div className="w-20 h-1 bg-admin-bg rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width:`${pct}%` }} />
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-admin-muted">
                      {coupon.validUntil ? formatDate((coupon.validUntil as any).toDate?.() || coupon.validUntil as any) : '—'}
                      {expired && <p className="text-red-400">Expired</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full ${coupon.isActive && !expired ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                        {coupon.isActive && !expired ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleActive(coupon)} className="p-1.5 rounded text-admin-muted hover:text-admin-text hover:bg-white/5 transition-colors">
                          {coupon.isActive ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} />}
                        </button>
                        <button onClick={() => deleteCoupon(coupon.id)} className="p-1.5 rounded text-admin-muted hover:text-red-400 hover:bg-white/5 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
