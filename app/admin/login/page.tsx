'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Authenticate admin session
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@zyrowear.com';
      
      // For local testing prototype access:
      if (email.trim().toLowerCase() === adminEmail.toLowerCase() || email.trim().toLowerCase() === 'admin@zyrowear.com') {
        sessionStorage.setItem('zyro_admin_auth', 'true');
        router.push('/admin/dashboard');
      } else {
        setErrorMsg('Unauthorized admin email. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-logo-header">
          <img src="/Logo/Zyro wears logo.png" alt="ZYRO WEAR ADMIN" className="admin-logo" />
          <h2>ADMIN DASHBOARD LOGIN</h2>
          <p>Protected area for ZYRO Wear Order Management</p>
        </div>

        {errorMsg && <div className="admin-error-banner">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="admin-form">
          <div className="form-group">
            <label>Admin Email Address</label>
            <input
              type="email"
              placeholder="admin@zyrowear.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Admin Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-admin-submit" disabled={loading}>
            {loading ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> AUTHENTICATING...</>
            ) : (
              <><i className="fa-solid fa-lock"></i> LOGIN TO DASHBOARD</>
            )}
          </button>
        </form>

        <div className="admin-back-link">
          <Link href="/"><i className="fa-solid fa-arrow-left"></i> Return to ZYRO Store</Link>
        </div>
      </div>
    </div>
  );
}
