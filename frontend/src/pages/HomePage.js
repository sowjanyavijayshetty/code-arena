
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const nav = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow orbs */}
      <div style={{ position: 'fixed', top: '20%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,77,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 28px', background: 'rgba(4,4,14,0.8)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,var(--purple),var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⌨</div>
          <span style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: 'var(--purple-light)', letterSpacing: 2 }}>CODE CREST</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>CYBOTIC · MITE</span>
      </div>

      {/* Main content */}
      <div style={{ textAlign: 'center', maxWidth: 560, position: 'relative', zIndex: 1 }}>
        {/* Event badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--cyan-dim)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 20, padding: '5px 14px', marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', letterSpacing: 2 }}>BID · BUILD · BREAK</span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 64, fontWeight: 900, lineHeight: 1, letterSpacing: '-1px', background: 'linear-gradient(135deg, #fff 0%, var(--purple-light) 50%, var(--cyan) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} className="glow-text">
            CODE<br />CREST
          </h1>
        </div>

        <p style={{ color: 'var(--text-3)', fontSize: 13, fontFamily: 'var(--mono)', letterSpacing: 2, marginBottom: 8 }}>POWERED BY CYBOTIC</p>
        <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7, marginBottom: 48 }}>
          Live coding competition with paired sessions,<br />auto-validation &amp; real-time execution.
        </p>

        {/* Action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <ActionCard
            icon="⌨"
            title="Participant"
            desc="Enter session ID and solve the challenge"
            onClick={() => nav('/compete')}
            accent="purple"
          />
          <ActionCard
            icon="🛠"
            title="Admin"
            desc="Manage questions, sessions & settings"
            onClick={() => nav('/admin/login')}
            accent="cyan"
          />
        </div>

        {/* Event info */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          {[
            { icon: '📅', label: 'Friday, April 24th' },
            { icon: '📍', label: 'IoT Lab, PG Block' },
            { icon: '🏛', label: 'MITE, Mangalore' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick, accent }) {
  const isP = accent === 'purple';
  return (
    <button onClick={onClick} style={{
      padding: '28px 20px', borderRadius: 'var(--radius-lg)', textAlign: 'left',
      border: `1px solid ${isP ? 'rgba(124,77,255,0.3)' : 'rgba(0,229,255,0.2)'}`,
      background: isP ? 'rgba(124,77,255,0.07)' : 'rgba(0,229,255,0.04)',
      color: 'var(--text-1)', cursor: 'pointer', transition: 'all 0.2s',
      fontFamily: 'var(--sans)', position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = isP ? '0 12px 40px rgba(124,77,255,0.25)' : '0 12px 40px rgba(0,229,255,0.15)';
      }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '50%', background: isP ? 'rgba(124,77,255,0.08)' : 'rgba(0,229,255,0.06)', transform: 'translate(20px,-20px)' }} />
      <div style={{ fontSize: 28, marginBottom: 14, position: 'relative' }}>{icon}</div>
      <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, fontFamily: 'var(--display)', fontSize: 13, letterSpacing: 1, color: isP ? 'var(--purple-light)' : 'var(--cyan)' }}>{title.toUpperCase()}</p>
      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</p>
    </button>
  );
}
