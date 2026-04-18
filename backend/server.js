const express = require('express');
const cors = require('cors');
const questionsRouter = require('./routes/questions');
const sessionsRouter = require('./routes/sessions');
const submitRouter = require('./routes/submit');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ Better CORS (important for Vercel)
app.use(cors({
  origin: '*'
}));

app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/questions', questionsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/submit', submitRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ✅ Root route (helps testing + uptime monitor)
app.get('/', (req, res) => {
  res.send('Code Arena Backend is Live 🚀');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Code Arena Backend running on port ${PORT}`);
});

module.exports = app;