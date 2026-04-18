'use client';
import { useState } from 'react';
import { Save, Store, Mail, Bell, Shield, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'VELVET',
    storeEmail: 'hello@velvetstore.com',
    storePhone: '+92 300 0000000',
    currency: 'PKR',
    freeShippingThreshold: 5000,
    shippingRate: 450,
    taxRate: 0,
    codFee: 150,
    lowStockAlert: 5,
    orderNotifications: true,
    returnNotifications: true,
    maintenanceMode: false,
  });

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    // In production: save to Firestore settings collection
    toast.success('Settings saved!');
    setSaving(false);
  };

  const update = (key: string, value: any) => setSettings(s => ({ ...s, [key]: value }));

  return (
    <div className="p-6 md:p-10 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-display font-light text-admin-text">Settings</h1>
        <p className="text-admin-muted text-sm mt-1">Store configuration and preferences</p>
      </div>

      {/* Store Info */}
      <div className="admin-card space-y-4">
        <h2 className="text-admin-text font-medium flex items-center gap-2"><Store size={16}/> Store Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Store Name</label>
            <input value={settings.storeName} onChange={e=>update('storeName',e.target.value)} className="admin-input"/>
          </div>
          <div>
            <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Store Email</label>
            <input value={settings.storeEmail} onChange={e=>update('storeEmail',e.target.value)} type="email" className="admin-input"/>
          </div>
          <div>
            <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Phone</label>
            <input value={settings.storePhone} onChange={e=>update('storePhone',e.target.value)} className="admin-input"/>
          </div>
          <div>
            <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Currency</label>
            <select value={settings.currency} onChange={e=>update('currency',e.target.value)} className="admin-input">
              <option value="PKR">PKR — Pakistani Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipping & Payments */}
      <div className="admin-card space-y-4">
        <h2 className="text-admin-text font-medium flex items-center gap-2"><Globe size={16}/> Shipping & Payments</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label:'Free Shipping Threshold (PKR)', key:'freeShippingThreshold' },
            { label:'Standard Shipping Rate (PKR)',  key:'shippingRate' },
            { label:'Tax Rate (%)',                   key:'taxRate' },
            { label:'COD Fee (PKR)',                  key:'codFee' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">{label}</label>
              <input type="number" value={(settings as any)[key]} onChange={e=>update(key,Number(e.target.value))} className="admin-input"/>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="admin-card space-y-4">
        <h2 className="text-admin-text font-medium flex items-center gap-2"><Bell size={16}/> Alerts & Notifications</h2>
        <div>
          <label className="block text-[10px] text-admin-muted uppercase tracking-wider mb-1.5">Low Stock Alert Threshold</label>
          <input type="number" value={settings.lowStockAlert} onChange={e=>update('lowStockAlert',Number(e.target.value))} className="admin-input w-32"/>
        </div>
        {[
          { label:'New Order Notifications',    key:'orderNotifications' },
          { label:'Return Request Notifications',key:'returnNotifications' },
          { label:'Maintenance Mode',           key:'maintenanceMode' },
        ].map(({ label, key }) => (
          <label key={key} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-admin-text">{label}</span>
            <input type="checkbox" checked={(settings as any)[key]} onChange={e=>update(key,e.target.checked)} className="w-4 h-4 accent-gold"/>
          </label>
        ))}
      </div>

      {/* API Keys reminder */}
      <div className="admin-card border-gold/20 bg-gold/5 space-y-3">
        <h2 className="text-gold font-medium flex items-center gap-2"><Shield size={16}/> API Keys Configuration</h2>
        <p className="text-sm text-admin-muted">The following keys are configured via environment variables in <code className="bg-admin-bg px-1.5 py-0.5 rounded text-gold font-mono text-xs">.env.local</code>:</p>
        <ul className="text-xs text-admin-muted space-y-1 list-disc list-inside">
          <li>Firebase: <code className="text-gold font-mono">NEXT_PUBLIC_FIREBASE_*</code></li>
          <li>Stripe:   <code className="text-gold font-mono">STRIPE_SECRET_KEY</code></li>
          <li>Cloudinary: <code className="text-gold font-mono">CLOUDINARY_*</code></li>
          <li>JazzCash: <code className="text-gold font-mono">JAZZCASH_*</code></li>
          <li>SendGrid: <code className="text-gold font-mono">SENDGRID_API_KEY</code></li>
        </ul>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary bg-gold text-black hover:bg-gold-light">
        {saving ? <><Save size={14} className="animate-spin"/> Saving…</> : <><Save size={14}/> Save Settings</>}
      </button>
    </div>
  );
}
