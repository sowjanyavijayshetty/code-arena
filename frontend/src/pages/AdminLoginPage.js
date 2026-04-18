
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
    setLoading(true); setError('');
    try {
      const res = await api.post('/admin/login', { password });
      login(res.data.token);
      nav('/admin');
    } catch { setError('Invalid password. Default: arena2024'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,77,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, marginBottom: 24, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>

        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '36px 32px', boxShadow: '0 0 60px rgba(124,77,255,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,var(--purple),var(--violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24, boxShadow: '0 0 30px var(--purple-glow)' }}>🛠</div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, letterSpacing: 2, color: 'var(--purple-light)' }}>ADMIN ACCESS</h2>
            <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>Enter password to continue</p>
          </div>

          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Admin password" value={password}
              onChange={e => setPassword(e.target.value)} className="input"
              style={{ marginBottom: 12, textAlign: 'center', letterSpacing: 3, fontSize: 16 }} autoFocus />
            {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="btn primary" style={{ width: '100%', padding: '12px', fontSize: 14 }} disabled={loading}>
              {loading ? 'Authenticating...' : 'LOGIN →'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Default: <span style={{ fontFamily: 'var(--mono)', color: 'var(--cyan)' }}>arena2024</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
