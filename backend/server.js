
const express = require('express');
const cors = require('cors');
const questionsRouter = require('./routes/questions');
const sessionsRouter = require('./routes/sessions');
const submitRouter = require('./routes/submit');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/questions', questionsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/submit', submitRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀  Code Arena Backend  →  http://localhost:${PORT}\n`);
});

module.exports = app;
