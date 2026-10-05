'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid email or password. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Set client session flag & full navigate to refresh middleware session cookies
      sessionStorage.setItem('zyro_admin_auth', 'true');
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your connection.');
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
              autoFocus
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
