'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Mail, Plus, Trash2, Star } from 'lucide-react';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { useAuth } from '@/lib/hooks/useAuth';
import { upsertUser } from '@/lib/firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Address } from '@/types';
import { addressSchema } from '@/lib/utils';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import toast from 'react-hot-toast';

type AddrForm = z.infer<typeof addressSchema>;

function ProfileContent() {
  const { user, appUser }         = useAuth();
  const [name, setName]           = useState(appUser?.displayName || '');
  const [phone, setPhone]         = useState(appUser?.phone || '');
  const [saving, setSaving]       = useState(false);
  const [addresses, setAddresses] = useState<Address[]>(appUser?.addresses || []);
  const [addingAddr, setAddingAddr] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddrForm>({ resolver: zodResolver(addressSchema) });

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser!, { displayName: name });
      await upsertUser(user.uid, { displayName: name, phone });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save profile'); }
    finally { setSaving(false); }
  };

  const saveAddress = async (data: AddrForm) => {
    if (!user) return;
    const newAddr: Address = { ...data, id: uuid(), label: 'Home', isDefault: addresses.length === 0, zip: data.zip || '' };
    const updated = [...addresses, newAddr];
    setAddresses(updated);
    await upsertUser(user.uid, { addresses: updated });
    toast.success('Address saved!');
    setAddingAddr(false);
    reset();
  };

  const removeAddress = async (id: string) => {
    if (!user) return;
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    await upsertUser(user.uid, { addresses: updated });
    toast.success('Address removed');
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    await upsertUser(user.uid, { addresses: updated });
    toast.success('Default address set');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-10 md:py-16 page-enter">
      <div className="mb-8">
        <Link href="/account" className="text-[11px] text-muted hover:text-black transition-colors tracking-wider uppercase mb-4 block">← My Account</Link>
        <h1 className="font-display text-4xl font-light">My Profile</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Personal info */}
        <div className="border border-border p-6">
          <h2 className="font-display text-2xl font-light mb-6 flex items-center gap-2"><User size={18} /> Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Email Address</label>
              <div className="relative">
                <input value={user?.email || ''} readOnly className="input-field bg-cream/50 cursor-not-allowed pr-16" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted uppercase tracking-wider">Verified</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000" className="input-field" />
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn-primary w-full mt-2">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Addresses */}
        <div className="border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-light">Saved Addresses</h2>
            <button onClick={() => setAddingAddr(!addingAddr)}
              className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase hover:text-gold transition-colors">
              <Plus size={14} /> Add New
            </button>
          </div>

          {addingAddr && (
            <form onSubmit={handleSubmit(saveAddress)} className="mb-6 p-4 border border-border space-y-3">
              <h3 className="text-sm font-medium">New Address</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input {...register('firstName')} placeholder="First name" className="input-field text-sm" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-0.5">{errors.firstName.message}</p>}
                </div>
                <div>
                  <input {...register('lastName')} placeholder="Last name" className="input-field text-sm" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-0.5">{errors.lastName.message}</p>}
                </div>
              </div>
              <input {...register('phone')} placeholder="Phone" className="input-field text-sm" />
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
              <input {...register('address')} placeholder="Street address" className="input-field text-sm" />
              {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
              <div className="grid grid-cols-2 gap-3">
                <input {...register('city')} placeholder="City" className="input-field text-sm" />
                <select {...register('province')} className="input-field text-sm">
                  <option value="">Province</option>
                  {['Sindh','Punjab','KPK','Balochistan','Islamabad (ICT)','AJK','GB'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input {...register('zip')} placeholder="Postal code" className="input-field text-sm" />
                <select {...register('country')} className="input-field text-sm">
                  {['Pakistan','United Kingdom','United States','UAE','Canada'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="btn-primary flex-1 py-2.5 text-xs">Save Address</button>
                <button type="button" onClick={() => setAddingAddr(false)} className="btn-outline flex-1 py-2.5 text-xs">Cancel</button>
              </div>
            </form>
          )}

          {addresses.length === 0 && !addingAddr ? (
            <p className="text-sm text-muted text-center py-8">No saved addresses yet.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map(addr => (
                <div key={addr.id} className={`p-4 border transition-colors ${addr.isDefault ? 'border-black bg-cream/30' : 'border-border'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      {addr.isDefault && <span className="text-[9px] tracking-wider uppercase bg-black text-white px-2 py-0.5 mb-2 inline-block">Default</span>}
                      <p className="font-medium text-sm">{addr.firstName} {addr.lastName}</p>
                      <p className="text-sm text-muted">{addr.address}</p>
                      <p className="text-sm text-muted">{addr.city}, {addr.province} {addr.zip}</p>
                      <p className="text-sm text-muted">{addr.country}</p>
                      <p className="text-xs text-muted mt-1">{addr.phone}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!addr.isDefault && (
                        <button onClick={() => setDefault(addr.id)} className="text-[10px] text-muted hover:text-black transition-colors uppercase tracking-wider flex items-center gap-1">
                          <Star size={10} /> Set default
                        </button>
                      )}
                      <button onClick={() => removeAddress(addr.id)} className="text-[10px] text-red-400 hover:text-red-600 transition-colors uppercase tracking-wider flex items-center gap-1">
                        <Trash2 size={10} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account security */}
      <div className="mt-8 border border-border p-6">
        <h2 className="font-display text-2xl font-light mb-4 flex items-center gap-2"><Mail size={18} /> Account Security</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Password</p>
            <p className="text-xs text-muted">Change your account password</p>
          </div>
          <a href="/auth/forgot-password" className="btn-outline text-xs py-2 px-4">Reset Password</a>
        </div>
      </div>
    </div>
  );
}

// Need Link import
import Link from 'next/link';

export default function ProfilePage() {
  return <AuthGuard><ProfileContent /></AuthGuard>;
}
