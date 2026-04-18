
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { adminAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET all questions (public, but hides test cases)
router.get('/', (req, res) => {
  const questions = store.questions.map(q => ({
    id: q.id,
    title: q.title,
    description: q.description,
    difficulty: q.difficulty,
    starterCode: q.starterCode,
    sampleTestCases: q.testCases.slice(0, 2),
    totalTestCases: q.testCases.length,
  }));
  res.json(questions);
});

// GET single question
router.get('/:id', (req, res) => {
  const q = store.questions.find(q => q.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });
  const { testCases, ...safe } = q;
  res.json({ ...safe, sampleTestCases: testCases.slice(0, 2), totalTestCases: testCases.length });
});

// Admin: GET all questions with test cases
router.get('/admin/full', adminAuth, (req, res) => {
  res.json(store.questions);
});

// Admin: CREATE question
router.post('/', adminAuth, (req, res) => {
  const { title, description, difficulty, starterCode, testCases } = req.body;
  if (!title || !description || !testCases || testCases.length === 0) {
    return res.status(400).json({ error: 'title, description, and testCases are required' });
  }
  const q = {
    id: 'q' + uuidv4().slice(0, 8),
    title,
    description,
    difficulty: difficulty || 'Medium',
    starterCode: starterCode || { javascript: '', python: '', java: '', cpp: '' },
    testCases,
  };
  store.questions.push(q);
  res.status(201).json(q);
});

// Admin: UPDATE question
router.put('/:id', adminAuth, (req, res) => {
  const idx = store.questions.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  store.questions[idx] = { ...store.questions[idx], ...req.body, id: req.params.id };
  res.json(store.questions[idx]);
});

// Admin: DELETE question
router.delete('/:id', adminAuth, (req, res) => {
  const idx = store.questions.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  store.questions.splice(idx, 1);
  res.json({ success: true });
});

module.exports = router;
