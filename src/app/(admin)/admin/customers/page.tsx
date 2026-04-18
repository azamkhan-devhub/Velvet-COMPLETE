'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Users, ArrowRight, Mail, Shield, ShieldOff } from 'lucide-react';
import { getDocs, query, orderBy, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { AppUser } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AppUser[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [roleFilter,setRoleFilter]= useState('all');

  useEffect(() => {
    getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
      .then(snap => { setCustomers(snap.docs.map(d => ({ uid:d.id, ...d.data() } as AppUser))); setLoading(false); });
  }, []);

  const toggleActive = async (customer: AppUser) => {
    await updateDoc(doc(db, 'users', customer.uid), { isActive: !customer.isActive });
    setCustomers(cs => cs.map(c => c.uid === customer.uid ? { ...c, isActive: !c.isActive } : c));
    toast.success(`Account ${!customer.isActive ? 'activated' : 'deactivated'}`);
  };

  const changeRole = async (customer: AppUser, role: string) => {
    await updateDoc(doc(db, 'users', customer.uid), { role });
    setCustomers(cs => cs.map(c => c.uid === customer.uid ? { ...c, role: role as any } : c));
    toast.success(`Role updated to ${role}`);
  };

  const filtered = customers.filter(c => {
    const matchSearch = c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.displayName?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || c.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-light text-admin-text">Customers</h1>
        <p className="text-admin-muted text-sm mt-1">{customers.length} registered accounts</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full bg-admin-surface border border-admin-border pl-10 pr-4 py-2.5 text-sm text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-gold/50 rounded-lg" />
        </div>
        <div className="flex gap-2">
          {['all','buyer','admin','seller'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`text-[11px] tracking-wider uppercase px-3 py-2 rounded-lg border transition-colors ${roleFilter === r ? 'bg-gold text-black border-gold' : 'border-admin-border text-admin-muted hover:text-admin-text'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-admin-surface rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                {['Customer','Email','Joined','Orders','Spent','Role','Status','Actions'].map(h => (
                  <th key={h} className="text-left pb-3 text-[10px] uppercase tracking-wider text-admin-muted font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(customer => (
                <tr key={customer.uid} className="admin-table-row">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      {customer.photoURL ? (
                        <Image src={customer.photoURL} alt="" width={32} height={32} className="rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-medium">
                          {customer.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="text-admin-text font-medium">{customer.displayName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-admin-muted text-xs">{customer.email}</td>
                  <td className="py-3 pr-4 text-admin-muted text-xs">{customer.createdAt ? formatDate(customer.createdAt as any) : '—'}</td>
                  <td className="py-3 pr-4 text-admin-text">{customer.totalOrders || 0}</td>
                  <td className="py-3 pr-4 text-admin-text">{formatPrice(customer.totalSpent || 0)}</td>
                  <td className="py-3 pr-4">
                    <select value={customer.role} onChange={e => changeRole(customer, e.target.value)}
                      className="text-[11px] bg-admin-bg border border-admin-border px-2 py-1 rounded text-admin-text focus:outline-none focus:border-gold/50">
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full ${customer.isActive !== false ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {customer.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleActive(customer)} title={customer.isActive !== false ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded text-admin-muted hover:text-admin-text hover:bg-white/5 transition-colors">
                        {customer.isActive !== false ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </button>
                      <a href={`mailto:${customer.email}`}
                        className="p-1.5 rounded text-admin-muted hover:text-gold hover:bg-white/5 transition-colors">
                        <Mail size={14} />
                      </a>
                    </div>
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
