
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
  javascript: 'JavaScript (Node.js)',
  python: 'Python 3',
  java: 'Java',
  cpp: 'C++',
};

export default function ParticipantPage() {
  const nav = useNavigate();
  const [sessionInput, setSessionInput] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [lang, setLang] = useState('javascript');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const [timerStarted, setTimerStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  const [pollCount, setPollCount] = useState(0);

  const session = sessionData?.session;
  const question = sessionData?.question;
  const timerMinutes = sessionData?.config?.timerMinutes || 30;

  // Poll for paired session timeout
  useEffect(() => {
    if (!session?.id || session?.timedOut || !timerStarted) return;
    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/sessions/${session.id}`);
        if (res.data.session.timedOut || res.data.session.status === 'timedout') {
          setSessionData(d => ({ ...d, session: res.data.session }));
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [session?.id, session?.timedOut, timerStarted]);

  // Countdown timer
  useEffect(() => {
    if (!timerStarted || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timerStarted, timeLeft]);

  const handleTimeout = useCallback(() => {
    clearTimeout(timerRef.current);
    api.patch(`/sessions/${session.id}`, { action: 'timeout' }).catch(() => {});
    setSessionData(d => ({ ...d, session: { ...d.session, timedOut: true, status: 'timedout' } }));
  }, [session]);

  const joinSession = async () => {
    if (!sessionInput.trim()) return;
    setLoading(true);
    setJoinError('');
    try {
      const res = await api.get(`/sessions/${sessionInput.trim().toUpperCase()}`);
      setSessionData(res.data);
      const startLang = 'javascript';
      setLang(startLang);
      setCode(res.data.question?.starterCode?.[startLang] || '');
      setTimeLeft((res.data.config?.timerMinutes || 30) * 60);
    } catch (e) {
      setJoinError(e.response?.data?.error || 'Session not found. Check your session ID.');
    } finally {
      setLoading(false);
    }
  };

  const changeLang = (newLang) => {
    setLang(newLang);
    setCode(question?.starterCode?.[newLang] || '');
    setResults(null);
  };

  const runCode = async () => {
    if (!question || !session) return;
    setRunning(true);
    setResults(null);
    try {
      const res = await api.post(`/submit/${session.id}`, { code, language: lang });
      setResults(res.data.results);
    } catch (e) {
      alert(e.response?.data?.error || 'Execution failed');
    } finally {
      setRunning(false);
    }
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
          ...d.session,
          status: 'submitted',
          submission: {
            timestamp: res.data.timestamp,
            passed: res.data.passed,
            total: res.data.total,
            allPassed: res.data.allPassed,
            language: lang,
          },
        },
      }));
    } catch (e) {
      alert(e.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fmtTime = (s) => {
    if (s === null || s === undefined) return '--:--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ── Join screen ──
  if (!sessionData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, marginBottom: 28, cursor: 'pointer' }}>← Back</button>
          <div style={{ width: 68, height: 68, borderRadius: 20, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32, boxShadow: '0 12px 40px rgba(108,92,231,0.35)' }}>⌨️</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Join Session</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 32 }}>Enter your session ID to begin the challenge</p>
          <input
            value={sessionInput}
            onChange={e => setSessionInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && joinSession()}
            placeholder="e.g. S01"
            className="input"
            style={{ textAlign: 'center', fontSize: 22, fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: 4, marginBottom: 12, padding: '14px' }}
            autoFocus
          />
          {joinError && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{joinError}</p>}
          <button className="btn primary" onClick={joinSession} disabled={loading} style={{ width: '100%', padding: '13px', fontSize: 15 }}>
            {loading ? 'Looking up...' : 'Enter Arena →'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 20 }}>Ask your organiser for your session ID</p>
        </div>
      </div>
    );
  }

  // ── Timed out ──
  if (session?.timedOut || session?.status === 'timedout') {
    const sub = session.submission;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>⏱️</div>
          <h2 style={{ fontSize: 34, fontWeight: 700, color: 'var(--red)', marginBottom: 10 }}>Session Ended</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            {sub ? `Your submission at ${sub.timestamp} scored ${sub.passed}/${sub.total} test cases.`
              : 'Your session has been closed — either time ran out or your pair solved it first.'}
          </p>
          <div style={{ background: 'var(--bg-2)', border: '1px solid rgba(225,112,85,0.2)', borderRadius: 'var(--radius-md)', padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Session</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{session.id}</span>
            </div>
            {sub && <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Submitted at</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{sub.timestamp}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Score</span>
                <span style={{ fontWeight: 600, color: sub.allPassed ? 'var(--green)' : 'var(--amber)' }}>{sub.passed}/{sub.total} passed</span>
              </div>
            </>}
          </div>
          <button className="btn" onClick={() => { setSessionData(null); setSessionInput(''); }} style={{ marginRight: 8 }}>← Back to Home</button>
        </div>
      </div>
    );
  }

  // ── All passed success ──
  if (submitResult?.allPassed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 34, fontWeight: 700, color: 'var(--green)', marginBottom: 10 }}>All Tests Passed!</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 15, marginBottom: 28 }}>Your solution has been accepted. Your paired session has been automatically closed.</p>
          <div style={{ background: 'var(--bg-2)', border: '1px solid rgba(0,184,148,0.2)', borderRadius: 'var(--radius-md)', padding: '20px 24px', textAlign: 'left', marginBottom: 24 }}>
            {[
              ['Session', session.id],
              ['Submitted at', submitResult.timestamp],
              ['Tests passed', `${submitResult.passed} / ${submitResult.total}`],
              ['Language', LANG_LABELS[lang]],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>{label}</span>
                <span style={{ fontSize: 13, fontFamily: label === 'Session' ? 'var(--mono)' : undefined, fontWeight: label === 'Session' ? 700 : 400, color: label === 'Tests passed' ? 'var(--green)' : 'var(--text-1)' }}>{val}</span>
              </div>
            ))}
          </div>
          <button className="btn" onClick={() => { setSessionData(null); setSessionInput(''); nav('/'); }}>← Back to Home</button>
        </div>
      </div>
    );
  }

  // ── Main editor ──
  const timerPct = timeLeft !== null ? (timeLeft / (timerMinutes * 60)) * 100 : 100;
  const timerColor = timerPct > 50 ? 'var(--green)' : timerPct > 20 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-0)' }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, background: 'var(--accent-dim)', color: 'var(--accent-light)', padding: '3px 12px', borderRadius: 20 }}>{session.id}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{question?.title}</span>
          <span className={`badge ${question?.difficulty === 'Easy' ? 'green' : question?.difficulty === 'Hard' ? 'red' : 'amber'}`}>{question?.difficulty}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {!timerStarted ? (
            <button className="btn primary" onClick={() => setTimerStarted(true)} style={{ fontSize: 13 }}>▶ Start Timer</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 90, height: 5, background: 'var(--bg-4)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: 3, transition: 'width 1s linear, background 1s' }} />
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: timerColor, minWidth: 56 }}>{fmtTime(timeLeft)}</span>
            </div>
          )}
          <select value={lang} onChange={e => changeLang(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--sans)' }}>
            {Object.entries(LANG_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', minHeight: 0 }}>
        {/* Left: problem */}
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '20px 22px', background: 'var(--bg-1)' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{question?.title}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 24 }}>{question?.description}</p>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-3)', marginBottom: 10 }}>SAMPLE CASES</p>
            {(question?.sampleTestCases || []).map((tc, i) => (
              <div key={i} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Example {i + 1}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Input</p>
                    <pre style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-2)', whiteSpace: 'pre-wrap', margin: 0 }}>{tc.input}</pre>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Expected</p>
                    <pre style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--green)', margin: 0 }}>{tc.expected}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-3)', marginBottom: 8 }}>NOTE</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
              {lang === 'javascript'
                ? 'Use readline() to read input. Use console.log() to print output. Each call to readline() reads the next line.'
                : lang === 'python' ? 'Use input() to read each line. Use print() for output.'
                : lang === 'java' ? 'Use Scanner with System.in. Class must be named Main.'
                : 'Read from cin. Write to cout. Include bits/stdc++.h if needed.'}
            </p>
          </div>
        </div>

        {/* Right: editor + results */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeMirror
              value={code}
              onChange={setCode}
              extensions={LANG_EXTENSIONS[lang] || []}
              theme={oneDark}
              style={{ height: '100%', fontSize: 13 }}
              basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: true }}
            />
          </div>

          {/* Action bar */}
          <div style={{ flexShrink: 0, background: 'var(--bg-2)', borderTop: '1px solid var(--border)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={runCode} disabled={running || submitting}>
                {running ? '⏳ Running...' : '▶ Run Code'}
              </button>
            </div>
            <button className="btn primary" onClick={submitCode} disabled={submitting || running} style={{ padding: '8px 28px' }}>
              {submitting ? '⏳ Submitting...' : '✓ Submit Solution'}
            </button>
          </div>

          {/* Results panel */}
          {results && (
            <div style={{ flexShrink: 0, background: 'var(--bg-1)', borderTop: '1px solid var(--border)', maxHeight: 240, overflowY: 'auto', padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-3)' }}>
                  RESULTS — {results.filter(r => r.passed).length}/{results.length} PASSED
                </p>
                {submitResult && (
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Submitted: {submitResult.timestamp}</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map((r, i) => (
                  <div key={i} style={{
                    background: r.passed ? 'rgba(0,184,148,0.06)' : 'rgba(225,112,85,0.06)',
                    border: `1px solid ${r.passed ? 'rgba(0,184,148,0.2)' : 'rgba(225,112,85,0.2)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: r.passed ? 'var(--green)' : 'var(--red)', minWidth: 36 }}>{r.passed ? '✓ PASS' : '✗ FAIL'}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Case {i + 1}</span>
                    </div>
                    {!r.passed && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                        <div>
                          <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>Expected</p>
                          <pre style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--green)', margin: 0 }}>{r.expected}</pre>
                        </div>
                        <div>
                          <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>Got</p>
                          <pre style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--red)', margin: 0 }}>{r.error || r.actual || '(no output)'}</pre>
                        </div>
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
