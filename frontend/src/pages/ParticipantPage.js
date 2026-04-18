
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import api from '../utils/api';

const LANG_EXTENSIONS = {
  javascript: [javascript()],
  python: [python()],
  java: [java()],
  cpp: [cpp()],
};

const LANG_LABELS = {
  javascript: 'JavaScript',
  python: 'Python 3',
  java: 'Java',
  cpp: 'C++',
};

// ── Waiting for opponent screen ───────────────────────────────────────────────
function WaitingScreen({ sessionId, pairedId, onBothReady }) {
  const [dots, setDots] = useState('');
  const [opponentReady, setOpponentReady] = useState(false);

  useEffect(() => {
    const d = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 600);
    return () => clearInterval(d);
  }, []);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/sessions/${sessionId}`);
        if (res.data.session.bothLoggedIn) {
          clearInterval(poll);
          setOpponentReady(true);
          setTimeout(onBothReady, 800);
        } else {
          setOpponentReady(res.data.session.pairedSessionLoggedIn);
        }
      } catch {}
    }, 1500);
    return () => clearInterval(poll);
  }, [sessionId]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Pulsing glow */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,77,255,0.15) 0%, transparent 70%)',
        animation: 'pulse 2s ease-in-out infinite', pointerEvents: 'none',
      }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)} } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ textAlign: 'center', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Hexagon spinner */}
        <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 32px' }}>
          <div style={{ width: 100, height: 100, border: '2px solid transparent', borderTopColor: 'var(--purple)', borderRightColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 1.2s linear infinite', position: 'absolute' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 32 }}>⌨</div>
        </div>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--purple-light)', letterSpacing: 2, marginBottom: 10 }}>
          WAITING FOR OPPONENT
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 32 }}>
          The challenge will begin once both participants are logged in{dots}
        </p>

        {/* Session status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
          {[
            { id: sessionId, label: 'You', ready: true },
            { id: pairedId, label: 'Opponent', ready: opponentReady },
          ].map(p => (
            <div key={p.id} style={{
              background: p.ready ? 'rgba(0,230,118,0.06)' : 'var(--bg-2)',
              border: `1px solid ${p.ready ? 'rgba(0,230,118,0.25)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)', padding: '16px 18px',
              transition: 'all 0.5s',
            }}>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, letterSpacing: 1 }}>{p.label.toUpperCase()}</p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: p.ready ? 'var(--green)' : 'var(--text-1)', marginBottom: 6 }}>{p.id}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.ready ? 'var(--green)' : 'var(--text-3)', boxShadow: p.ready ? '0 0 8px var(--green)' : 'none', display: 'inline-block', transition: 'all 0.4s' }} />
                <span style={{ fontSize: 12, color: p.ready ? 'var(--green)' : 'var(--text-3)' }}>{p.ready ? 'Ready' : 'Not connected'}</span>
              </div>
            </div>
          ))}
        </div>

        {opponentReady && (
          <div style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 20px', animation: 'pulse 1s ease-in-out infinite' }}>
            <p style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 600 }}>Both players ready — launching challenge...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Timed out screen ──────────────────────────────────────────────────────────
function TimedOutScreen({ session, onBack }) {
  const sub = session.submission;
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,82,82,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 72, marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(255,82,82,0.5))' }}>⏱</div>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 900, color: 'var(--red)', marginBottom: 10, letterSpacing: 2 }}>SESSION ENDED</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
          {sub ? `You submitted at ${sub.timestamp} — scored ${sub.passed}/${sub.total} test cases.`
            : 'Your session has been closed. Either time expired or your opponent solved the challenge first.'}
        </p>
        <div style={{ background: 'var(--bg-2)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: 'var(--radius-md)', padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
          {[
            ['Session', session.id],
            ...(sub ? [
              ['Submitted at', sub.timestamp],
              ['Score', `${sub.passed}/${sub.total} passed`],
              ['Language', LANG_LABELS[sub.language] || sub.language],
            ] : []),
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: 'var(--text-3)', fontSize: 13 }}>{label}</span>
              <span style={{ fontSize: 13, fontFamily: label === 'Session' ? 'var(--mono)' : undefined, fontWeight: label === 'Session' ? 700 : 400 }}>{val}</span>
            </div>
          ))}
        </div>
        <button className="btn" onClick={onBack}>← Back to Home</button>
      </div>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ sessionId, submitResult, lang, onBack }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }`}</style>
      <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,230,118,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 80, marginBottom: 16, animation: 'float 2s ease-in-out infinite', display: 'inline-block' }}>🏆</div>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 900, color: 'var(--green)', marginBottom: 10, letterSpacing: 2, textShadow: '0 0 30px rgba(0,230,118,0.5)' }}>ALL TESTS PASSED!</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
          Your solution has been accepted. Your opponent's session has been automatically closed.
        </p>
        <div style={{ background: 'var(--bg-2)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 'var(--radius-md)', padding: '20px 24px', textAlign: 'left', marginBottom: 24 }}>
          {[
            ['Session', sessionId],
            ['Submitted at', submitResult.timestamp],
            ['Tests passed', `${submitResult.passed} / ${submitResult.total}`],
            ['Language', LANG_LABELS[lang] || lang],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: 'var(--text-3)', fontSize: 13 }}>{label}</span>
              <span style={{ fontSize: 13, fontFamily: label === 'Session' ? 'var(--mono)' : undefined, fontWeight: label === 'Session' ? 700 : 400, color: label === 'Tests passed' ? 'var(--green)' : 'var(--text-1)' }}>{val}</span>
            </div>
          ))}
        </div>
        <button className="btn" onClick={onBack}>← Back to Home</button>
      </div>
    </div>
  );
}

// ── Main participant page ─────────────────────────────────────────────────────
export default function ParticipantPage() {
  const nav = useNavigate();
  const [sessionInput, setSessionInput] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [waitingPhase, setWaitingPhase] = useState(false); // true = waiting for opponent

  const [lang, setLang] = useState('javascript');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // Timer — starts immediately when both are ready
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);
  const timerMinutes = sessionData?.config?.timerMinutes || 30;

  const session = sessionData?.session;
  const question = sessionData?.question;

  // ── Poll for opponent login & session state ───────────────────────────────
  useEffect(() => {
    if (!session?.id || !waitingPhase) return;
    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/sessions/${session.id}`);
        if (res.data.session.timedOut) {
          setSessionData(res.data);
          setWaitingPhase(false);
          clearInterval(poll);
        } else if (res.data.session.bothLoggedIn) {
          setSessionData(res.data);
          // don't clear waitingPhase here — WaitingScreen handles the transition
        }
      } catch {}
    }, 1500);
    return () => clearInterval(poll);
  }, [session?.id, waitingPhase]);

  // ── Poll for paired session timeout while in editor ───────────────────────
  useEffect(() => {
    if (!session?.id || waitingPhase || !question) return;
    if (session?.timedOut || submitResult?.allPassed) return;
    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/sessions/${session.id}`);
        if (res.data.session.timedOut || res.data.session.status === 'timedout') {
          setSessionData(d => ({ ...d, session: res.data.session }));
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [session?.id, waitingPhase, question, submitResult]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || waitingPhase) return;
    if (timeLeft <= 0) {
      clearTimeout(timerRef.current);
      api.patch(`/sessions/${session.id}`, { action: 'timeout' }).catch(() => {});
      setSessionData(d => ({ ...d, session: { ...d.session, timedOut: true, status: 'timedout' } }));
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, waitingPhase]);

  const joinSession = async () => {
    if (!sessionInput.trim()) return;
    setLoading(true); setJoinError('');
    try {
      const res = await api.get(`/sessions/${sessionInput.trim().toUpperCase()}`);
      if (res.data.session.timedOut) {
        setSessionData(res.data);
        setWaitingPhase(false);
        return;
      }
      setSessionData(res.data);
      const bothReady = res.data.session.bothLoggedIn;
      if (bothReady) {
        const startLang = 'javascript';
        setLang(startLang);
        setCode(res.data.question?.starterCode?.[startLang] || '');
        setTimeLeft((res.data.config?.timerMinutes || 30) * 60);
        setWaitingPhase(false);
      } else {
        setWaitingPhase(true);
      }
    } catch (e) {
      setJoinError(e.response?.data?.error || 'Session not found. Check your ID.');
    } finally { setLoading(false); }
  };

  const handleBothReady = useCallback(async () => {
    // Re-fetch to get question data, then start
    try {
      const res = await api.get(`/sessions/${session.id}`);
      setSessionData(res.data);
      const startLang = 'javascript';
      setLang(startLang);
      setCode(res.data.question?.starterCode?.[startLang] || '');
      setTimeLeft((res.data.config?.timerMinutes || 30) * 60);
      setWaitingPhase(false);
    } catch {}
  }, [session?.id]);

  const changeLang = (newLang) => {
    setLang(newLang);
    setCode(question?.starterCode?.[newLang] || '');
    setResults(null);
  };

  const runCode = async () => {
    if (!question || !session) return;
    setRunning(true); setResults(null);
    try {
      const res = await api.post(`/submit/${session.id}`, { code, language: lang });
      setResults(res.data.results);
    } catch (e) { alert(e.response?.data?.error || 'Execution failed'); }
    finally { setRunning(false); }
  };

  const submitCode = async () => {
    if (!question || !session) return;
    if (!window.confirm('Submit your solution? This will be your official submission.')) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/submit/${session.id}`, { code, language: lang });
      setResults(res.data.results);
      setSubmitResult(res.data);
      setSessionData(d => ({
        ...d,
        session: {
          ...d.session, status: 'submitted',
          submission: { timestamp: res.data.timestamp, passed: res.data.passed, total: res.data.total, allPassed: res.data.allPassed, language: lang },
        },
      }));
    } catch (e) { alert(e.response?.data?.error || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const fmtTime = (s) => {
    if (s === null || s === undefined) return '--:--';
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const handleBack = () => { nav('/'); };

  // ── Join screen ───────────────────────────────────────────────────────────
  if (!sessionData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
        <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,77,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, marginBottom: 28, cursor: 'pointer', fontFamily: 'var(--sans)' }}>← Back</button>

          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,var(--purple),var(--violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 34, boxShadow: '0 0 40px var(--purple-glow)' }}>⌨</div>

          <h1 style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 900, letterSpacing: 2, color: 'var(--purple-light)', marginBottom: 8 }}>JOIN ARENA</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 32 }}>Enter your session ID to join the competition</p>

          <input
            value={sessionInput}
            onChange={e => setSessionInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && joinSession()}
            placeholder="e.g. S01"
            className="input"
            style={{ textAlign: 'center', fontSize: 28, fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: 6, marginBottom: 12, padding: '16px', color: 'var(--cyan)', border: '1px solid var(--border-cyan)' }}
            autoFocus
          />

          {joinError && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', marginBottom: 12 }}>
              <p style={{ color: 'var(--red)', fontSize: 13 }}>{joinError}</p>
            </div>
          )}

          <button className="btn cyan" onClick={joinSession} disabled={loading} style={{ width: '100%', padding: '13px', fontSize: 15, fontFamily: 'var(--display)', letterSpacing: 2 }}>
            {loading ? 'CONNECTING...' : 'ENTER ARENA →'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 20 }}>Get your session ID from the organiser</p>
        </div>
      </div>
    );
  }

  // ── Timed out ─────────────────────────────────────────────────────────────
  if (session?.timedOut || session?.status === 'timedout') {
    return <TimedOutScreen session={session} onBack={handleBack} />;
  }

  // ── Waiting for opponent ──────────────────────────────────────────────────
  if (waitingPhase) {
    return (
      <WaitingScreen
        sessionId={session.id}
        pairedId={session.pairedWith || '???'}
        onBothReady={handleBothReady}
      />
    );
  }

  // ── All tests passed ──────────────────────────────────────────────────────
  if (submitResult?.allPassed) {
    return <SuccessScreen sessionId={session.id} submitResult={submitResult} lang={lang} onBack={handleBack} />;
  }

  // ── Main editor ───────────────────────────────────────────────────────────
  const timerPct = timeLeft !== null ? (timeLeft / (timerMinutes * 60)) * 100 : 100;
  const timerColor = timerPct > 50 ? 'var(--green)' : timerPct > 20 ? 'var(--amber)' : 'var(--red)';
  const timerGlow = timerPct > 50 ? 'rgba(0,230,118,0.4)' : timerPct > 20 ? 'rgba(255,171,64,0.4)' : 'rgba(255,82,82,0.5)';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-0)' }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, background: 'rgba(7,7,26,0.95)', borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--purple)', marginRight: 4 }}>CODE CREST</span>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--cyan)', background: 'var(--cyan-dim)', padding: '3px 12px', borderRadius: 20, border: '1px solid rgba(0,229,255,0.2)' }}>{session.id}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{question?.title}</span>
          <span className={`badge ${question?.difficulty === 'Easy' ? 'green' : question?.difficulty === 'Hard' ? 'red' : 'amber'}`}>{question?.difficulty}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Timer — always running */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 90, height: 4, background: 'var(--bg-5)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear', boxShadow: `0 0 8px ${timerGlow}` }} />
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: timerColor, minWidth: 56, textShadow: `0 0 10px ${timerGlow}` }}>{fmtTime(timeLeft)}</span>
          </div>

          <select value={lang} onChange={e => changeLang(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text-1)', fontSize: 12, fontFamily: 'var(--mono)' }}>
            {Object.entries(LANG_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 0, overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '20px 20px', background: 'rgba(7,7,26,0.7)' }}>
          <div style={{ display: 'inline-flex', gap: 6, marginBottom: 14 }}>
            <span className="badge cyan">Q</span>
            <span className={`badge ${question?.difficulty === 'Easy' ? 'green' : question?.difficulty === 'Hard' ? 'red' : 'amber'}`}>{question?.difficulty}</span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text-1)' }}>{question?.title}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 22 }}>{question?.description}</p>

          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--text-3)', marginBottom: 10 }}>SAMPLE CASES</p>
          {(question?.sampleTestCases || []).map((tc, i) => (
            <div key={i} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 10 }}>
              <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 8, letterSpacing: 1 }}>EXAMPLE {i + 1}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['Input', tc.input, 'var(--text-2)'], ['Output', tc.expected, 'var(--cyan)']].map(([lbl, val, col]) => (
                  <div key={lbl}>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>{lbl}</p>
                    <pre style={{ fontSize: 12, fontFamily: 'var(--mono)', color: col, whiteSpace: 'pre-wrap', margin: 0 }}>{val}</pre>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginTop: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--purple)', marginBottom: 6 }}>INPUT FORMAT</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
              {lang === 'javascript' ? 'Use readline() for input, console.log() for output.'
                : lang === 'python' ? 'Use input() to read each line. print() for output.'
                : lang === 'java' ? 'Use Scanner with System.in. Class must be named Main.'
                : 'Read from cin. Write to cout.'}
            </p>
          </div>
        </div>

        {/* Right: editor */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeMirror
              value={code} onChange={setCode}
              extensions={LANG_EXTENSIONS[lang] || []}
              theme={oneDark}
              style={{ height: '100%', fontSize: 13 }}
              basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: true }}
            />
          </div>

          {/* Action bar */}
          <div style={{ flexShrink: 0, background: 'rgba(7,7,26,0.95)', borderTop: '1px solid var(--border)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(8px)' }}>
            <button className="btn" onClick={runCode} disabled={running || submitting}>
              {running ? '⏳ Running...' : '▶ Run Code'}
            </button>
            <button className="btn primary" onClick={submitCode} disabled={submitting || running} style={{ padding: '8px 32px', fontSize: 14, fontFamily: 'var(--display)', letterSpacing: 1 }}>
              {submitting ? 'SUBMITTING...' : '✓ SUBMIT'}
            </button>
          </div>

          {/* Results */}
          {results && (
            <div style={{ flexShrink: 0, background: 'var(--bg-1)', borderTop: '1px solid var(--border)', maxHeight: 230, overflowY: 'auto', padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-3)' }}>
                  RESULTS — <span style={{ color: results.every(r => r.passed) ? 'var(--green)' : 'var(--amber)' }}>{results.filter(r => r.passed).length}/{results.length} PASSED</span>
                </p>
                {submitResult && <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>Submitted: {submitResult.timestamp}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map((r, i) => (
                  <div key={i} style={{
                    background: r.passed ? 'rgba(0,230,118,0.05)' : 'rgba(255,82,82,0.05)',
                    border: `1px solid ${r.passed ? 'rgba(0,230,118,0.2)' : 'rgba(255,82,82,0.2)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: r.passed ? 'var(--green)' : 'var(--red)', minWidth: 40, fontFamily: 'var(--mono)' }}>{r.passed ? '✓ OK' : '✗ FAIL'}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Case {i + 1}</span>
                    </div>
                    {!r.passed && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                        {[['Expected', r.expected, 'var(--cyan)'], ['Got', r.error || r.actual || '(no output)', 'var(--red)']].map(([lbl, val, col]) => (
                          <div key={lbl}>
                            <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>{lbl}</p>
                            <pre style={{ fontSize: 12, fontFamily: 'var(--mono)', color: col, margin: 0 }}>{val}</pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
