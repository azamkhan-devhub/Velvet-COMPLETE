'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword }   = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch { toast.error('Failed to send reset email. Check the address and try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12 bg-cream">
      <div className="bg-white w-full max-w-md p-10 shadow-sm">
        <Link href="/" className="font-display text-2xl font-semibold tracking-[0.22em] uppercase block mb-10">Velvet</Link>

        {sent ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-6" />
            <h1 className="font-display text-3xl font-light mb-3">Check your inbox</h1>
            <p className="text-muted text-sm mb-8">We&apos;ve sent a password reset link to <strong>{email}</strong>. Check your spam folder if you don&apos;t see it.</p>
            <Link href="/auth/login" className="btn-primary w-full justify-center">Back to Sign In</Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-light mb-2">Reset password</h1>
            <p className="text-muted text-sm mb-8">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-muted mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" className="input-field pl-10" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
            <Link href="/auth/login" className="flex items-center gap-2 text-sm text-muted hover:text-black transition-colors mt-6">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
