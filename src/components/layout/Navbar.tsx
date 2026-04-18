'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Heart, Search, Menu, X, User, ChevronDown, LogOut, Package, Settings } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useWishlistStore } from '@/lib/store';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

const navLinks = [
  { label: 'New In',      href: '/shop?filter=new' },
  { label: 'Collections', href: '/collections',
    sub: [
      { label: 'Summer Luxe',    href: '/collections/summer-luxe' },
      { label: 'The Essentials', href: '/collections/essentials' },
      { label: 'Evening Edit',   href: '/collections/evening-edit' },
    ]
  },
  { label: 'Shop All', href: '/shop' },
  { label: 'About',    href: '/about' },
];

export function Navbar() {
  const [scrolled,         setScrolled]         = useState(false);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [searchOpen,       setSearchOpen]       = useState(false);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [activeDropdown,   setActiveDropdown]   = useState<string | null>(null);
  const [userMenuOpen,     setUserMenuOpen]     = useState(false);

  const cartCount  = useCartStore(s => s.itemCount());
  const openCart   = useCartStore(s => s.openCart);
  const wishCount  = useWishlistStore(s => s.productIds.length);
  const { user, appUser, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    toast.success('Signed out successfully');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
    }
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-black text-gold-light text-center py-2.5 px-4 text-[10px] tracking-[0.22em] uppercase font-body">
        Complimentary shipping on orders over PKR 5,000 &nbsp;·&nbsp; New Summer Luxe collection — Shop now
      </div>

      {/* Main Nav */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-[0_2px_30px_rgba(0,0,0,0.06)]' : 'bg-white/90 backdrop-blur-md'}`}>
        <nav className="max-w-[1440px] mx-auto px-5 md:px-10 flex items-center justify-between h-[68px]">

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -ml-2 text-black hover:text-gold transition-colors" aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
            <span className="font-display text-2xl md:text-[1.7rem] font-semibold tracking-[0.22em] uppercase select-none">Velvet</span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <li key={link.href} className="relative group"
                onMouseEnter={() => link.sub && setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}>
                <Link href={link.href}
                  className="flex items-center gap-1 text-[11px] tracking-[0.18em] uppercase font-medium text-black hover:text-gold transition-colors py-2">
                  {link.label}
                  {link.sub && <ChevronDown size={12} className="transition-transform group-hover:rotate-180 duration-200" />}
                </Link>
                <span className="absolute bottom-0 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
                {link.sub && activeDropdown === link.label && (
                  <div className="absolute top-full left-0 bg-white border border-border shadow-lg min-w-[200px] py-2 animate-fade-in">
                    {link.sub.map(sub => (
                      <Link key={sub.href} href={sub.href}
                        className="block px-5 py-3 text-[11px] tracking-[0.12em] uppercase text-black hover:text-gold hover:bg-cream transition-colors"
                        onClick={() => setActiveDropdown(null)}>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-black hover:text-gold transition-colors" aria-label="Search">
              <Search size={19} />
            </button>

            <Link href="/wishlist" className="p-2 text-black hover:text-gold transition-colors relative" aria-label="Wishlist">
              <Heart size={19} />
              {wishCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-gold text-black text-[8px] rounded-full flex items-center justify-center font-medium">{wishCount}</span>
              )}
            </Link>

            {/* User menu */}
            <div className="relative hidden md:block">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2 text-black hover:text-gold transition-colors flex items-center gap-1.5" aria-label="Account">
                {user?.photoURL ? (
                  <Image src={user.photoURL} alt="Avatar" width={22} height={22} className="rounded-full" />
                ) : (
                  <User size={19} />
                )}
                {user && <ChevronDown size={11} className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />}
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-border shadow-xl min-w-[220px] py-2 z-20 animate-fade-in">
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-sm font-medium truncate">{appUser?.displayName || user.displayName}</p>
                          <p className="text-[11px] text-muted truncate">{user.email}</p>
                          {isAdmin && (
                            <span className="mt-1 inline-block text-[9px] tracking-wider uppercase bg-gold/20 text-gold px-2 py-0.5">
                              {appUser?.role}
                            </span>
                          )}
                        </div>
                        <Link href="/account" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-cream transition-colors">
                          <User size={14} /> My Account
                        </Link>
                        <Link href="/account/orders" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-cream transition-colors">
                          <Package size={14} /> My Orders
                        </Link>
                        {isAdmin && (
                          <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gold hover:bg-cream transition-colors">
                            <Settings size={14} /> Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-border mt-1 pt-1">
                          <button onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full">
                            <LogOut size={14} /> Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/login" onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm hover:bg-cream transition-colors">Sign In</Link>
                        <Link href="/auth/register" onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm hover:bg-cream transition-colors">Create Account</Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Cart */}
            <button onClick={openCart}
              className="p-2 text-black hover:text-gold transition-colors relative ml-1" aria-label="Cart">
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-black text-white text-[8px] rounded-full flex items-center justify-center font-medium">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Search bar */}
        <div className={`overflow-hidden transition-all duration-300 ${searchOpen ? 'max-h-20 border-b border-border' : 'max-h-0'}`}>
          <form onSubmit={handleSearch} className="max-w-[1440px] mx-auto px-5 md:px-10 py-3 flex items-center gap-4">
            <Search size={16} className="text-muted shrink-0" />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              type="search" placeholder="Search pieces, collections, fabrics..."
              className="flex-1 bg-transparent text-sm font-body text-black placeholder:text-muted/50 focus:outline-none"
              autoFocus={searchOpen}
            />
            <button type="button" onClick={() => setSearchOpen(false)} className="text-muted hover:text-black transition-colors">
              <X size={16} />
            </button>
          </form>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white overflow-y-auto pt-[68px]">
          <nav className="px-6 py-8 flex flex-col gap-1">
            {navLinks.map(link => (
              <div key={link.href}>
                <Link href={link.href} onClick={() => setMobileOpen(false)}
                  className="block py-4 text-xl font-display font-light border-b border-border hover:text-gold transition-colors">
                  {link.label}
                </Link>
                {link.sub && (
                  <div className="pl-4 mt-1">
                    {link.sub.map(sub => (
                      <Link key={sub.href} href={sub.href} onClick={() => setMobileOpen(false)}
                        className="block py-2.5 text-[11px] tracking-[0.15em] uppercase text-muted hover:text-gold transition-colors">
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="mt-8 flex flex-col gap-3">
              {user ? (
                <>
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="btn-outline text-center">My Account</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setMobileOpen(false)} className="btn-primary text-center">Admin Panel</Link>}
                  <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="btn-ghost text-red-500">Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login"    onClick={() => setMobileOpen(false)} className="btn-primary text-center">Sign In</Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="btn-outline text-center">Create Account</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
