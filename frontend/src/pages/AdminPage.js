
import React, { useState, useEffect, useCallback } from 'react';
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
  if (loading && !dashboard) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', padding: '16px 0', marginRight: 24 }}>⌨️ Code Arena Admin</span>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--sans)',
              color: tab === t ? 'var(--accent-light)' : 'var(--text-3)',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
              transition: 'all 0.15s',
            }}>{TAB_LABELS[t]}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={fetchDashboard} style={{ fontSize: 12 }}>↻ Refresh</button>
          <button className="btn danger" onClick={() => { logout(); nav('/'); }} style={{ fontSize: 12 }}>Logout</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '28px 28px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        {tab === 'dashboard' && <DashboardTab data={dashboard} onRefresh={fetchDashboard} />}
        {tab === 'questions' && <QuestionsTab questions={dashboard?.questions || []} onRefresh={fetchDashboard} />}
        {tab === 'sessions' && <SessionsTab sessions={dashboard?.sessions || []} questions={dashboard?.questions || []} onRefresh={fetchDashboard} />}
        {tab === 'settings' && <SettingsTab config={dashboard?.config} onRefresh={fetchDashboard} />}
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function DashboardTab({ data, onRefresh }) {
  if (!data) return null;
  const { stats, sessions, questions } = data;

  const statCards = [
    { label: 'Total Sessions', value: stats.total, color: 'var(--accent-light)' },
    { label: 'Solved', value: stats.solved, color: 'var(--green)' },
    { label: 'Submitted', value: stats.submitted, color: 'var(--amber)' },
    { label: 'Timed Out', value: stats.timedOut, color: 'var(--red)' },
    { label: 'Waiting', value: stats.waiting, color: 'var(--text-2)' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--text-2)' }}>Live Session Overview</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: Math.ceil(sessions.length / 2) }, (_, i) => {
          const s1 = sessions[i * 2], s2 = sessions[i * 2 + 1];
          if (!s1 || !s2) return null;
          const q = questions[s1.questionIndex];
          return (
            <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span className="badge purple">Pair {i + 1}</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>→ {q?.title || 'No question'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[s1, s2].map(s => (
                  <SessionCard key={s.id} session={s} compact />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Questions ──────────────────────────────────────────────────────────────
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
    if (!form.title.trim()) return alert('Title is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/questions/${editing}`, form);
      } else {
        await api.post('/questions', form);
      }
      setShowForm(false);
      onRefresh();
      const r = await api.get('/questions/admin/full');
      setFullQuestions(r.data);
    } catch (e) { alert(e.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const deleteQ = async (id) => {
    if (!window.confirm('Delete this question? Sessions assigned to it will lose their question.')) return;
    await api.delete(`/questions/${id}`);
    onRefresh();
    const r = await api.get('/questions/admin/full');
    setFullQuestions(r.data);
  };

  const addTC = () => setForm(f => ({ ...f, testCases: [...f.testCases, { input: '', expected: '' }] }));
  const removeTC = (i) => setForm(f => ({ ...f, testCases: f.testCases.filter((_, j) => j !== i) }));
  const updateTC = (i, field, val) => setForm(f => ({ ...f, testCases: f.testCases.map((t, j) => j === i ? { ...t, [field]: val } : t) }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700 }}>Questions ({fullQuestions.length})</h2>
        <button className="btn primary" onClick={openAdd}>+ Add Question</button>
      </div>

      {!showForm ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {fullQuestions.map((q, i) => (
            <div key={q.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    <span className="badge purple">Q{i + 1}</span>
                    <span className={`badge ${q.difficulty === 'Easy' ? 'green' : q.difficulty === 'Hard' ? 'red' : 'amber'}`}>{q.difficulty}</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{q.title}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => openEdit(q)}>Edit</button>
                  <button className="btn danger" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => deleteQ(q.id)}>Delete</button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 10 }}>{q.description}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{q.testCases.length} test cases</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>{editing ? 'Edit Question' : 'New Question'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Question title" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Difficulty</label>
                <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--sans)' }}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" rows={3} placeholder="Problem statement..." style={{ resize: 'vertical' }} />
            </div>

            <div>
              <div style={{ display: 'flex', gap: 0, marginBottom: 10 }}>
                {['javascript', 'python', 'java', 'cpp'].map(l => (
                  <button key={l} onClick={() => setActiveStarter(l)} style={{
                    padding: '6px 14px', background: activeStarter === l ? 'var(--bg-4)' : 'var(--bg-1)',
                    border: '1px solid var(--border)', color: activeStarter === l ? 'var(--text-1)' : 'var(--text-3)',
                    fontSize: 12, fontFamily: 'var(--sans)', cursor: 'pointer', marginRight: 4, borderRadius: 'var(--radius-sm)',
                  }}>{l}</button>
                ))}
              </div>
              <textarea
                value={form.starterCode?.[activeStarter] || ''}
                onChange={e => setForm(f => ({ ...f, starterCode: { ...f.starterCode, [activeStarter]: e.target.value } }))}
                className="input" rows={6}
                placeholder={`Starter code for ${activeStarter}...`}
                style={{ fontFamily: 'var(--mono)', fontSize: 12, resize: 'vertical' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--text-3)' }}>Test Cases *</label>
                <button className="btn success" style={{ padding: '4px 12px', fontSize: 12 }} onClick={addTC}>+ Add Case</button>
              </div>
              {form.testCases.map((tc, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'start' }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Input (use \n for new line)</p>
                    <textarea value={tc.input} onChange={e => updateTC(i, 'input', e.target.value)} rows={2}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 12, fontFamily: 'var(--mono)', resize: 'vertical' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>Expected output</p>
                    <textarea value={tc.expected} onChange={e => updateTC(i, 'expected', e.target.value)} rows={2}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 12, fontFamily: 'var(--mono)', resize: 'vertical' }} />
                  </div>
                  <button className="btn danger" style={{ padding: '6px 10px', fontSize: 12, marginTop: 20 }} onClick={() => removeTC(i)}>✕</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
              <button className="btn primary" onClick={saveQuestion} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Question' : 'Add Question'}</button>
              <button className="btn" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sessions ──────────────────────────────────────────────────────────────
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
    if (!window.confirm('Force timeout both sessions in this pair?')) return;
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
        <h2 style={{ fontSize: 19, fontWeight: 700 }}>Sessions ({sessions.length})</h2>
        <button className="btn success" onClick={addPair}>+ Add Session Pair</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: Math.ceil(sessions.length / 2) }, (_, i) => {
          const s1 = sessions[i * 2], s2 = sessions[i * 2 + 1];
          if (!s1 || !s2) return null;
          const q = questions[s1.questionIndex];
          return (
            <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge purple">Pair {i + 1}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Question assigned:</span>
                  <select value={s1.questionIndex} onChange={e => changeQ(s1.id, e.target.value)}
                    style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 12, fontFamily: 'var(--sans)' }}>
                    {questions.map((q, qi) => <option key={q.id} value={qi}>Q{qi + 1}: {q.title}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn danger" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => timeoutPair(s1.id)}>Force Timeout</button>
                  <button className="btn danger" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => deletePair(s1.id)}>Delete Pair</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[s1, s2].map(s => (
                  <SessionCard key={s.id} session={s} onReset={() => resetSession(s.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionCard({ session, compact, onReset }) {
  const s = session;
  const statusColor = s.timedOut ? 'var(--red)' : s.status === 'submitted' && s.submission?.allPassed ? 'var(--green)' : s.status === 'submitted' ? 'var(--amber)' : 'var(--text-3)';
  const statusLabel = s.timedOut ? 'TIMED OUT' : s.status === 'submitted' ? (s.submission?.allPassed ? 'SOLVED' : 'SUBMITTED') : 'WAITING';

  return (
    <div style={{
      background: 'var(--bg-3)', borderRadius: 'var(--radius-md)', padding: '12px 16px',
      border: `1px solid ${s.timedOut ? 'rgba(225,112,85,0.2)' : s.submission?.allPassed ? 'rgba(0,184,148,0.2)' : 'var(--border)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.submission ? 8 : 0 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700 }}>{s.id}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
      </div>
      {s.submission && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, lineHeight: 1.6 }}>
          <div>Submitted: {s.submission.timestamp}</div>
          <div style={{ color: s.submission.allPassed ? 'var(--green)' : 'var(--amber)' }}>
            {s.submission.passed}/{s.submission.total} tests passed
          </div>
        </div>
      )}
      {!compact && onReset && (
        <button className="btn" style={{ padding: '4px 10px', fontSize: 11, marginTop: 4 }} onClick={onReset}>Reset</button>
      )}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────
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
      <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 24 }}>Settings</h2>
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Timer Duration (minutes)</label>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>This is the countdown timer shown to participants. Applied when they click "Start Timer".</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="number" min={1} max={180} value={timer} onChange={e => setTimer(Number(e.target.value))}
              style={{ width: 100, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 16, textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }} />
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{timer} minutes = {(timer * 60).toLocaleString()} seconds</span>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Change Admin Password</label>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="input" placeholder="New password (leave blank to keep current)" />
        </div>

        <div style={{ paddingTop: 4 }}>
          <button className="btn primary" onClick={save} disabled={saving} style={{ padding: '10px 28px' }}>
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>

        <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginTop: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Judge0 Integration</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
            For Python, Java, and C++ execution, set the <code style={{ fontFamily: 'var(--mono)', color: 'var(--accent-light)' }}>JUDGE0_URL</code> and optionally <code style={{ fontFamily: 'var(--mono)', color: 'var(--accent-light)' }}>JUDGE0_KEY</code> environment variables in your backend .env file. JavaScript runs natively in the Node.js backend.
          </p>
        </div>
      </div>
    </div>
  );
}
