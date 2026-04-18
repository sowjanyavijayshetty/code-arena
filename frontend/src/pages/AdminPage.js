
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAdmin } from '../context/AdminContext';

const TABS = ['dashboard', 'questions', 'sessions', 'settings'];
const TAB_LABELS = { dashboard: '📊 Dashboard', questions: '📝 Questions', sessions: '👥 Sessions', settings: '⚙️ Settings' };

export default function AdminPage() {
  const { isAdmin, logout } = useAdmin();
  const nav = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) { nav('/admin/login'); return; }
    fetchDashboard();
  }, [isAdmin]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setDashboard(res.data);
    } catch { nav('/admin/login'); }
    finally { setLoading(false); }
  };

  if (!isAdmin) return null;
  if (loading && !dashboard) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '2px solid var(--purple)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 12 }}>LOADING...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'rgba(7,7,26,0.95)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'var(--purple-light)', padding: '16px 0', marginRight: 24 }}>CODE CREST · ADMIN</span>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontFamily: 'var(--sans)', color: tab === t ? 'var(--cyan)' : 'var(--text-3)',
              borderBottom: `2px solid ${tab === t ? 'var(--cyan)' : 'transparent'}`,
              transition: 'all 0.15s',
            }}>{TAB_LABELS[t]}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={fetchDashboard} style={{ fontSize: 12 }}>↻ Refresh</button>
          <button className="btn danger" onClick={() => { logout(); nav('/'); }} style={{ fontSize: 12 }}>Logout</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '28px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        {tab === 'dashboard' && <DashboardTab data={dashboard} onRefresh={fetchDashboard} />}
        {tab === 'questions' && <QuestionsTab questions={dashboard?.questions || []} onRefresh={fetchDashboard} />}
        {tab === 'sessions' && <SessionsTab sessions={dashboard?.sessions || []} questions={dashboard?.questions || []} onRefresh={fetchDashboard} />}
        {tab === 'settings' && <SettingsTab config={dashboard?.config} onRefresh={fetchDashboard} />}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, letterSpacing: 1 }}>{label.toUpperCase()}</p>
      <p style={{ fontSize: 32, fontWeight: 700, color, fontFamily: 'var(--mono)', textShadow: color !== 'var(--text-2)' ? `0 0 20px ${color}60` : 'none' }}>{value}</p>
    </div>
  );
}

function SessionCard({ session, compact, onReset }) {
  const s = session;
  const isLogged = s.loggedIn;
  const isSolved = s.submission?.allPassed;
  const isSubmitted = s.status === 'submitted';
  const isTimedOut = s.timedOut;
  const statusLabel = isTimedOut ? 'TIMED OUT' : isSolved ? 'SOLVED' : isSubmitted ? 'SUBMITTED' : isLogged ? 'ONLINE' : 'WAITING';
  const statusColor = isTimedOut ? 'var(--red)' : isSolved ? 'var(--green)' : isSubmitted ? 'var(--amber)' : isLogged ? 'var(--cyan)' : 'var(--text-3)';

  return (
    <div style={{
      background: 'var(--bg-3)', borderRadius: 'var(--radius-md)', padding: '12px 16px',
      border: `1px solid ${isTimedOut ? 'rgba(255,82,82,0.2)' : isSolved ? 'rgba(0,230,118,0.2)' : isLogged ? 'rgba(0,229,255,0.15)' : 'var(--border)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.submission ? 8 : 0 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: isLogged ? 'var(--cyan)' : 'var(--text-1)' }}>{s.id}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block', boxShadow: `0 0 6px ${statusColor}` }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, letterSpacing: 1 }}>{statusLabel}</span>
        </div>
      </div>
      {s.loginTime && <p style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>Logged in: {new Date(s.loginTime).toLocaleTimeString()}</p>}
      {s.submission && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
          <div>Submitted: {s.submission.timestamp}</div>
          <div style={{ color: isSolved ? 'var(--green)' : 'var(--amber)' }}>{s.submission.passed}/{s.submission.total} tests passed</div>
        </div>
      )}
      {!compact && onReset && (
        <button className="btn" style={{ padding: '4px 10px', fontSize: 11, marginTop: 8 }} onClick={onReset}>Reset</button>
      )}
    </div>
  );
}

function DashboardTab({ data, onRefresh }) {
  if (!data) return null;
  const { stats, sessions, questions } = data;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatCard label="Total" value={stats.total} color="var(--purple-light)" />
        <StatCard label="Solved" value={stats.solved} color="var(--green)" />
        <StatCard label="Submitted" value={stats.submitted} color="var(--amber)" />
        <StatCard label="Timed Out" value={stats.timedOut} color="var(--red)" />
        <StatCard label="Waiting" value={stats.waiting} color="var(--text-2)" />
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: 'var(--text-3)', marginBottom: 14 }}>LIVE PAIRS</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: Math.ceil(sessions.length / 2) }, (_, i) => {
          const s1 = sessions[i * 2], s2 = sessions[i * 2 + 1];
          if (!s1 || !s2) return null;
          const q = questions[s1.questionIndex];
          const bothOnline = s1.loggedIn && s2.loggedIn;
          return (
            <div key={i} style={{ background: 'var(--bg-2)', border: `1px solid ${bothOnline ? 'rgba(0,229,255,0.2)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span className="badge purple">Pair {i + 1}</span>
                {bothOnline && <span className="badge cyan">● BOTH ONLINE</span>}
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>→ {q?.title || 'No question'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <SessionCard session={s1} compact />
                <SessionCard session={s2} compact />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionsTab({ questions, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = { title: '', description: '', difficulty: 'Easy', testCases: [{ input: '', expected: '' }], starterCode: { javascript: '', python: '', java: '', cpp: '' } };
  const [form, setForm] = useState(emptyForm);
  const [fullQuestions, setFullQuestions] = useState([]);
  const [activeStarter, setActiveStarter] = useState('javascript');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/questions/admin/full').then(r => setFullQuestions(r.data)).catch(() => {});
  }, [questions]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (q) => { setEditing(q.id); setForm({ ...q, testCases: q.testCases.map(t => ({ ...t })) }); setShowForm(true); };

  const saveQuestion = async () => {
    if (!form.title.trim()) return alert('Title required');
    setSaving(true);
    try {
      if (editing) await api.put(`/questions/${editing}`, form);
      else await api.post('/questions', form);
      setShowForm(false);
      onRefresh();
      const r = await api.get('/questions/admin/full');
      setFullQuestions(r.data);
    } catch (e) { alert(e.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const deleteQ = async (id) => {
    if (!window.confirm('Delete question?')) return;
    await api.delete(`/questions/${id}`);
    onRefresh();
    const r = await api.get('/questions/admin/full');
    setFullQuestions(r.data);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--display)', letterSpacing: 1, color: 'var(--purple-light)' }}>QUESTIONS ({fullQuestions.length})</h2>
        {!showForm && <button className="btn primary" onClick={openAdd}>+ Add Question</button>}
      </div>

      {!showForm ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {fullQuestions.map((q, i) => (
            <div key={q.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <span className="badge purple">Q{i + 1}</span>
                    <span className={`badge ${q.difficulty === 'Easy' ? 'green' : q.difficulty === 'Hard' ? 'red' : 'amber'}`}>{q.difficulty}</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>{q.title}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => openEdit(q)}>Edit</button>
                  <button className="btn danger" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => deleteQ(q.id)}>Del</button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 8 }}>{q.description}</p>
              <p style={{ fontSize: 12, color: 'var(--purple)', fontFamily: 'var(--mono)' }}>{q.testCases.length} test cases</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, fontFamily: 'var(--display)', letterSpacing: 1, color: 'var(--cyan)' }}>{editing ? 'EDIT QUESTION' : 'NEW QUESTION'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 6, letterSpacing: 1 }}>TITLE *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Question title" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 6, letterSpacing: 1 }}>DIFFICULTY</label>
                <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--sans)' }}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 6, letterSpacing: 1 }}>DESCRIPTION *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" rows={3} placeholder="Problem statement..." style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 8, letterSpacing: 1 }}>STARTER CODE</label>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {['javascript', 'python', 'java', 'cpp'].map(l => (
                  <button key={l} onClick={() => setActiveStarter(l)} style={{
                    padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'var(--mono)', cursor: 'pointer',
                    background: activeStarter === l ? 'var(--purple-dim)' : 'var(--bg-1)',
                    border: `1px solid ${activeStarter === l ? 'var(--purple)' : 'var(--border)'}`,
                    color: activeStarter === l ? 'var(--purple-light)' : 'var(--text-3)',
                  }}>{l}</button>
                ))}
              </div>
              <textarea value={form.starterCode?.[activeStarter] || ''} onChange={e => setForm(f => ({ ...f, starterCode: { ...f.starterCode, [activeStarter]: e.target.value } }))}
                className="input" rows={6} placeholder={`Starter code for ${activeStarter}...`} style={{ fontFamily: 'var(--mono)', fontSize: 12, resize: 'vertical' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: 1 }}>TEST CASES *</label>
                <button className="btn success" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => setForm(f => ({ ...f, testCases: [...f.testCases, { input: '', expected: '' }] }))}>+ Add Case</button>
              </div>
              {form.testCases.map((tc, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                  <div>
                    {i === 0 && <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Input (\\n = new line)</p>}
                    <textarea value={tc.input} onChange={e => setForm(f => ({ ...f, testCases: f.testCases.map((t, j) => j === i ? { ...t, input: e.target.value } : t) }))} rows={2}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 12, fontFamily: 'var(--mono)', resize: 'vertical' }} />
                  </div>
                  <div>
                    {i === 0 && <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Expected output</p>}
                    <textarea value={tc.expected} onChange={e => setForm(f => ({ ...f, testCases: f.testCases.map((t, j) => j === i ? { ...t, expected: e.target.value } : t) }))} rows={2}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 12, fontFamily: 'var(--mono)', resize: 'vertical' }} />
                  </div>
                  <button className="btn danger" style={{ padding: '6px 10px', fontSize: 11, marginTop: i === 0 ? 20 : 0 }} onClick={() => setForm(f => ({ ...f, testCases: f.testCases.filter((_, j) => j !== i) }))}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary" onClick={saveQuestion} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Question'}</button>
              <button className="btn" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionsTab({ sessions, questions, onRefresh }) {
  const addPair = async () => {
    const qIdx = Math.floor(sessions.length / 2) % Math.max(questions.length, 1);
    await api.post('/sessions/pair', { questionIndex: qIdx });
    onRefresh();
  };

  const changeQ = async (id, qIdx) => {
    await api.patch(`/sessions/${id}`, { questionIndex: parseInt(qIdx) });
    onRefresh();
  };

  const resetSession = async (id) => {
    await api.patch(`/sessions/${id}`, { action: 'reset' });
    onRefresh();
  };

  const timeoutPair = async (id) => {
    if (!window.confirm('Force timeout both sessions?')) return;
    await api.patch(`/sessions/${id}`, { action: 'timeout' });
    onRefresh();
  };

  const deletePair = async (id) => {
    if (!window.confirm('Delete this session pair?')) return;
    await api.delete(`/sessions/${id}`);
    onRefresh();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--display)', letterSpacing: 1, color: 'var(--purple-light)' }}>SESSIONS ({sessions.length})</h2>
        <button className="btn success" onClick={addPair}>+ Add Session Pair</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: Math.ceil(sessions.length / 2) }, (_, i) => {
          const s1 = sessions[i * 2], s2 = sessions[i * 2 + 1];
          if (!s1 || !s2) return null;
          const bothOnline = s1.loggedIn && s2.loggedIn;
          return (
            <div key={i} style={{ background: 'var(--bg-2)', border: `1px solid ${bothOnline ? 'rgba(0,229,255,0.2)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge purple">Pair {i + 1}</span>
                  {bothOnline && <span className="badge cyan">● BOTH ONLINE</span>}
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Question:</span>
                  <select value={s1.questionIndex} onChange={e => changeQ(s1.id, e.target.value)}
                    style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 12, fontFamily: 'var(--sans)' }}>
                    {questions.map((q, qi) => <option key={q.id} value={qi}>Q{qi + 1}: {q.title}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn danger" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => timeoutPair(s1.id)}>Force Timeout</button>
                  <button className="btn danger" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => deletePair(s1.id)}>Delete Pair</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <SessionCard session={s1} onReset={() => resetSession(s1.id)} />
                <SessionCard session={s2} onReset={() => resetSession(s2.id)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsTab({ config, onRefresh }) {
  const [timer, setTimer] = useState(config?.timerMinutes || 30);
  const [newPass, setNewPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/admin/config', { timerMinutes: timer, ...(newPass ? { adminPassword: newPass } : {}) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onRefresh();
    } catch { alert('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--display)', letterSpacing: 1, color: 'var(--purple-light)', marginBottom: 24 }}>SETTINGS</h2>
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-2)' }}>Timer Duration (minutes)</label>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>Timer starts automatically when both participants in a pair log in.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="number" min={1} max={180} value={timer} onChange={e => setTimer(Number(e.target.value))}
              style={{ width: 100, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-cyan)', background: 'var(--bg-1)', color: 'var(--cyan)', fontSize: 20, textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700, outline: 'none' }} />
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{timer} min = {(timer * 60).toLocaleString()}s</span>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-2)' }}>Change Admin Password</label>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="input" placeholder="New password (blank = keep current)" />
        </div>
        <button className="btn primary" onClick={save} disabled={saving} style={{ padding: '11px 28px', fontSize: 14 }}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>

        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--purple)', marginBottom: 6 }}>SESSION FLOW</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.8 }}>
            1. Both participants enter their session IDs<br/>
            2. Each sees a "Waiting for opponent" screen<br/>
            3. Once both are logged in → challenge + timer start simultaneously<br/>
            4. First to pass all tests → opponent session auto-closes
          </p>
        </div>

        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--cyan)', marginBottom: 6 }}>JUDGE0 INTEGRATION</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
            Set <code style={{ fontFamily: 'var(--mono)', color: 'var(--purple-light)' }}>JUDGE0_URL</code> and <code style={{ fontFamily: 'var(--mono)', color: 'var(--purple-light)' }}>JUDGE0_KEY</code> in backend .env for Python/Java/C++ execution.
          </p>
        </div>
      </div>
    </div>
  );
}
