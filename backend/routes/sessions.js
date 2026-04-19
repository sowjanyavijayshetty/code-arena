
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { adminAuth } = require('../middleware/auth');

// GET session by ID (participant) — also marks session as 'online'
router.get('/:id', (req, res) => {
  const session = store.sessions.find(s => s.id.toUpperCase() === req.params.id.toUpperCase());
  if (!session) return res.status(404).json({ error: 'Session not found' });

  // Mark this session as logged in
  const idx = store.sessions.findIndex(s => s.id === session.id);
  if (store.sessions[idx].status === 'waiting' && !store.sessions[idx].loggedIn) {
    store.sessions[idx].loggedIn = true;
    store.sessions[idx].loginTime = new Date().toISOString();
  }

  const paired = store.sessions.find(s => s.id === session.pairedWith);
  const bothLoggedIn = store.sessions[idx].loggedIn && (paired ? paired.loggedIn : true);

  const qIdx = session.questionIndex;
  const question = store.questions[qIdx] || store.questions[0];

  res.json({
    session: {
      id: store.sessions[idx].id,
      status: store.sessions[idx].status,
      timedOut: store.sessions[idx].timedOut,
      loggedIn: store.sessions[idx].loggedIn,
      bothLoggedIn,
      pairedSessionLoggedIn: paired ? paired.loggedIn : true,
      submission: store.sessions[idx].submission ? {
        timestamp: store.sessions[idx].submission.timestamp,
        passed: store.sessions[idx].submission.passed,
        total: store.sessions[idx].submission.total,
        allPassed: store.sessions[idx].submission.allPassed,
        language: store.sessions[idx].submission.language,
      } : null,
    },
    question: bothLoggedIn && question ? {
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
  const id1 = 'S' + String(store.sessions.length + 1).padStart(2, '0');
  const id2 = 'S' + String(store.sessions.length + 2).padStart(2, '0');
  const now = new Date().toISOString();
  const s1 = { id: id1, pairedWith: id2, questionIndex: qIdx, status: 'waiting', submission: null, timedOut: false, loggedIn: false, loginTime: null, createdAt: now };
  const s2 = { id: id2, pairedWith: id1, questionIndex: qIdx, status: 'waiting', submission: null, timedOut: false, loggedIn: false, loginTime: null, createdAt: now };
  store.sessions.push(s1, s2);
  res.status(201).json([s1, s2]);
});

// Admin: UPDATE session
router.patch('/:id', adminAuth, (req, res) => {
  const idx = store.sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { action, questionIndex } = req.body;

  if (action === 'reset') {
    store.sessions[idx] = { ...store.sessions[idx], status: 'waiting', submission: null, timedOut: false, loggedIn: false, loginTime: null };
  } else if (action === 'timeout') {
    const paired = store.sessions[idx].pairedWith;
    store.sessions[idx] = { ...store.sessions[idx], timedOut: true, status: 'timedout' };
    const pairedIdx = store.sessions.findIndex(s => s.id === paired);
    if (pairedIdx !== -1) store.sessions[pairedIdx] = { ...store.sessions[pairedIdx], timedOut: true, status: 'timedout' };
  } else if (typeof questionIndex === 'number') {
    const paired = store.sessions[idx].pairedWith;
    store.sessions[idx] = { ...store.sessions[idx], questionIndex };
    const pairedIdx = store.sessions.findIndex(s => s.id === paired);
    if (pairedIdx !== -1) store.sessions[pairedIdx] = { ...store.sessions[pairedIdx], questionIndex };
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
