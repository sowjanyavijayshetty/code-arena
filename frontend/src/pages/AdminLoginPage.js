
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAdmin } from '../context/AdminContext';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdmin();
  const nav = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/admin/login', { password });
      login(res.data.token);
      nav('/admin');
    } catch {
      setError('Invalid password. Try: arena2024');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-0)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, marginBottom: 28, cursor: 'pointer' }}>
          ← Back
        </button>
        <div style={{
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '32px 28px',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Admin Login</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 24 }}>Enter the admin password to continue</p>

          <form onSubmit={handleLogin}>
            <input
              type="password" placeholder="Admin password" value={password}
              onChange={e => setPassword(e.target.value)}
              className="input" style={{ marginBottom: 12 }} autoFocus
            />
            {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button type="submit" className="btn primary" style={{ width: '100%', padding: '11px' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login →'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Default password: <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-light)' }}>arena2024</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
