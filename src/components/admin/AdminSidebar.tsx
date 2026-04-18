'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, BarChart3,
  RotateCcw, Settings, LogOut, ChevronLeft, ChevronRight,
  Boxes, Menu
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

const NAV = [
  { label: 'Dashboard',  href: '/admin',             icon: LayoutDashboard },
  { label: 'Products',   href: '/admin/products',    icon: Package },
  { label: 'Orders',     href: '/admin/orders',      icon: ShoppingBag },
  { label: 'Customers',  href: '/admin/customers',   icon: Users },
  { label: 'Inventory',  href: '/admin/inventory',   icon: Boxes },
  { label: 'Coupons',    href: '/admin/coupons',     icon: Tag },
  { label: 'Returns',    href: '/admin/returns',     icon: RotateCcw },
  { label: 'Analytics',  href: '/admin/analytics',   icon: BarChart3 },
  { label: 'Settings',   href: '/admin/settings',    icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { appUser, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center justify-between px-5 py-5 border-b border-admin-border shrink-0`}>
        {!collapsed && (
          <Link href="/admin" className="font-display text-xl font-semibold tracking-[0.2em] uppercase text-admin-text">
            Velvet <span className="text-gold text-xs tracking-wider font-body font-normal">ADMIN</span>
          </Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="text-admin-muted hover:text-admin-text transition-colors hidden lg:flex">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
              ${isActive(href)
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'text-admin-muted hover:text-admin-text hover:bg-white/5'}`}>
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm font-body font-medium">{label}</span>}
          </Link>
        ))}
      </nav>

      {/* User + signout */}
      <div className="border-t border-admin-border px-3 py-4 space-y-1 shrink-0">
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-admin-muted hover:text-admin-text hover:bg-white/5 transition-all text-sm">
          <Package size={16} />
          {!collapsed && 'View Store'}
        </Link>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm">
          <LogOut size={16} />
          {!collapsed && 'Sign Out'}
        </button>
        {!collapsed && appUser && (
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs text-admin-text font-medium truncate">{appUser.displayName}</p>
            <p className="text-[10px] text-admin-muted truncate">{appUser.email}</p>
            <span className="text-[9px] tracking-wider uppercase text-gold bg-gold/10 px-2 py-0.5 mt-1 inline-block rounded">{appUser.role}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-admin-surface border border-admin-border p-2 rounded-lg text-admin-text">
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-admin-bg border-r border-admin-border">
            <SidebarContent />
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col bg-admin-bg border-r border-admin-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} shrink-0`}>
        <SidebarContent />
      </div>
    </>
  );
}
