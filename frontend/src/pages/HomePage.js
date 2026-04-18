
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const nav = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-0)', padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 22, margin: '0 auto 28px',
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38, boxShadow: '0 20px 60px rgba(108,92,231,0.3)',
        }}>⌨️</div>

        <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-1.5px', marginBottom: 10 }}>
          Code Arena
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, lineHeight: 1.7, marginBottom: 48 }}>
          A live coding competition platform with auto-validation,<br/>
          paired sessions, and real-time execution.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card
            icon="🧑‍💻" title="Participant"
            desc="Enter your session ID and solve the coding challenge"
            onClick={() => nav('/compete')}
            accent
          />
          <Card
            icon="🛠️" title="Admin"
            desc="Manage questions, sessions, timer and view results"
            onClick={() => nav('/admin/login')}
          />
        </div>

        <p style={{ marginTop: 32, fontSize: 12, color: 'var(--text-3)' }}>
          Code Arena v1.0 · Built for competition
        </p>
      </div>
    </div>
  );
}

function Card({ icon, title, desc, onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      padding: '24px 20px', borderRadius: 'var(--radius-lg)', textAlign: 'left',
      border: `1px solid ${accent ? 'rgba(108,92,231,0.3)' : 'var(--border)'}`,
      background: accent ? 'rgba(108,92,231,0.07)' : 'var(--bg-2)',
      color: 'var(--text-1)', cursor: 'pointer', transition: 'all 0.2s',
      fontFamily: 'var(--sans)',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</p>
    </button>
  );
}
