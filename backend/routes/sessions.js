
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { adminAuth } = require('../middleware/auth');

// GET session by ID (participant)
router.get('/:id', (req, res) => {
  const session = store.sessions.find(s => s.id.toUpperCase() === req.params.id.toUpperCase());
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const qIdx = session.questionIndex;
  const question = store.questions[qIdx] || store.questions[0];

  res.json({
    session: {
      id: session.id,
      status: session.status,
      timedOut: session.timedOut,
      submission: session.submission ? {
        timestamp: session.submission.timestamp,
        passed: session.submission.passed,
        total: session.submission.total,
        allPassed: session.submission.allPassed,
        language: session.submission.language,
      } : null,
    },
    question: question ? {
      id: question.id,
      title: question.title,
      description: question.description,
      difficulty: question.difficulty,
      starterCode: question.starterCode,
      sampleTestCases: question.testCases.slice(0, 2),
      totalTestCases: question.testCases.length,
    } : null,
    config: {
      timerMinutes: store.config.timerMinutes,
    },
  });
});

// Admin: GET all sessions
router.get('/', adminAuth, (req, res) => {
  res.json(store.sessions);
});

// Admin: CREATE session pair
router.post('/pair', adminAuth, (req, res) => {
  const { questionIndex } = req.body;
  const qIdx = typeof questionIndex === 'number' ? questionIndex : Math.floor(store.sessions.length / 2) % store.questions.length;
  const pairNum = Math.floor(store.sessions.length / 2) + 1;
  const id1 = 'S' + String(store.sessions.length + 1).padStart(2, '0');
  const id2 = 'S' + String(store.sessions.length + 2).padStart(2, '0');
  const now = new Date().toISOString();
  const s1 = { id: id1, pairedWith: id2, questionIndex: qIdx, status: 'waiting', submission: null, timedOut: false, createdAt: now };
  const s2 = { id: id2, pairedWith: id1, questionIndex: qIdx, status: 'waiting', submission: null, timedOut: false, createdAt: now };
  store.sessions.push(s1, s2);
  res.status(201).json([s1, s2]);
});

// Admin: UPDATE session (change question, reset, timeout)
router.patch('/:id', adminAuth, (req, res) => {
  const idx = store.sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const { action, questionIndex } = req.body;

  if (action === 'reset') {
    store.sessions[idx] = { ...store.sessions[idx], status: 'waiting', submission: null, timedOut: false };
  } else if (action === 'timeout') {
    const paired = store.sessions[idx].pairedWith;
    store.sessions[idx] = { ...store.sessions[idx], timedOut: true, status: 'timedout' };
    const pairedIdx = store.sessions.findIndex(s => s.id === paired);
    if (pairedIdx !== -1) {
      store.sessions[pairedIdx] = { ...store.sessions[pairedIdx], timedOut: true, status: 'timedout' };
    }
  } else if (typeof questionIndex === 'number') {
    const paired = store.sessions[idx].pairedWith;
    store.sessions[idx] = { ...store.sessions[idx], questionIndex };
    const pairedIdx = store.sessions.findIndex(s => s.id === paired);
    if (pairedIdx !== -1) {
      store.sessions[pairedIdx] = { ...store.sessions[pairedIdx], questionIndex };
    }
  }

  res.json(store.sessions[idx]);
});

// Admin: DELETE session pair
router.delete('/:id', adminAuth, (req, res) => {
  const session = store.sessions.find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });
  const toRemove = new Set([session.id, session.pairedWith]);
  store.sessions = store.sessions.filter(s => !toRemove.has(s.id));
  res.json({ success: true });
});

module.exports = router;
