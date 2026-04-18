
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { adminAuth } = require('../middleware/auth');

router.get('/config', adminAuth, (req, res) => {
  res.json({ timerMinutes: store.config.timerMinutes });
});

router.put('/config', adminAuth, (req, res) => {
  const { timerMinutes, adminPassword } = req.body;
  if (typeof timerMinutes === 'number') store.config.timerMinutes = timerMinutes;
  if (adminPassword) store.config.adminPassword = adminPassword;
  res.json({ timerMinutes: store.config.timerMinutes });
});

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === store.config.adminPassword) {
    res.json({ success: true, token: store.config.adminPassword });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

router.get('/dashboard', adminAuth, (req, res) => {
  const total = store.sessions.length;
  const submitted = store.sessions.filter(s => s.status === 'submitted').length;
  const timedOut = store.sessions.filter(s => s.timedOut).length;
  const waiting = store.sessions.filter(s => s.status === 'waiting').length;
  const solved = store.sessions.filter(s => s.submission?.allPassed).length;

  res.json({
    stats: { total, submitted, timedOut, waiting, solved },
    sessions: store.sessions,
    questions: store.questions.map(q => ({
      id: q.id, title: q.title, difficulty: q.difficulty,
      testCases: q.testCases.length,
      questionIndex: store.questions.indexOf(q),
    })),
    config: { timerMinutes: store.config.timerMinutes },
  });
});

module.exports = router;
