
const express = require('express');
const router = express.Router();
const axios = require('axios');
const store = require('../data/store');

// Judge0 language IDs
const LANG_IDS = {
  javascript: 63,  // Node.js
  python: 71,      // Python 3
  java: 62,        // Java
  cpp: 54,         // C++ (GCC 9.2)
};

// Wrap JS code so readline() works with Judge0 stdin
function wrapJavaScript(code, input) {
  const lines = input.split('\n');
  const wrapped = `
const _lines = ${JSON.stringify(lines)};
let _lineIdx = 0;
function readline() { return _lines[_lineIdx++] || ''; }
${code}
`;
  return wrapped;
}

async function runWithJudge0(code, language, input, judge0Url, judge0Key) {
  const langId = LANG_IDS[language];
  if (!langId) return { ok: false, output: `Language ${language} not supported` };

  const finalCode = language === 'javascript' ? wrapJavaScript(code, input) : code;

  try {
    const createRes = await axios.post(
      `${judge0Url}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: finalCode,
        language_id: langId,
        stdin: input,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(judge0Key ? { 'X-RapidAPI-Key': judge0Key } : {}),
        },
        timeout: 15000,
      }
    );

    const data = createRes.data;
    const stdout = (data.stdout || '').trim();
    const stderr = (data.stderr || '').trim();
    const compile_output = (data.compile_output || '').trim();
    const status = data.status?.description || 'Unknown';

    if (data.status?.id === 3) {
      return { ok: true, output: stdout };
    } else {
      const errMsg = compile_output || stderr || `Runtime error: ${status}`;
      return { ok: false, output: errMsg };
    }
  } catch (err) {
    return { ok: false, output: `Execution service error: ${err.message}` };
  }
}

// In-browser JS fallback (runs on server with VM-like eval)
function runJavaScriptLocally(code, input) {
  try {
    const lines = (input || '').split('\n');
    let lineIdx = 0;
    const outputs = [];
    const fn = new Function('readline', 'console', code);
    fn(
      () => lines[lineIdx++] || '',
      { log: (...args) => outputs.push(args.map(String).join(' ')) }
    );
    return { ok: true, output: outputs.join('\n') };
  } catch (e) {
    return { ok: false, output: e.message };
  }
}

// POST /api/submit/:sessionId
router.post('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required' });
  }

  const session = store.sessions.find(s => s.id.toUpperCase() === sessionId.toUpperCase());
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.timedOut) return res.status(403).json({ error: 'Session has timed out' });
  if (session.status === 'submitted' && session.submission?.allPassed) {
    return res.status(403).json({ error: 'Already submitted successfully' });
  }

  const question = store.questions[session.questionIndex] || store.questions[0];
  if (!question) return res.status(404).json({ error: 'No question assigned' });

  const judge0Url = process.env.JUDGE0_URL;
  const judge0Key = process.env.JUDGE0_KEY;

  // Run all test cases
  const results = [];
  for (const tc of question.testCases) {
    let result;
    if (language === 'javascript' && !judge0Url) {
      result = runJavaScriptLocally(code, tc.input);
    } else if (judge0Url) {
      result = await runWithJudge0(code, language, tc.input, judge0Url, judge0Key);
    } else {
      result = { ok: false, output: `${language} requires Judge0. Set JUDGE0_URL env var.` };
    }

    const actual = (result.output || '').trim();
    const expected = (tc.expected || '').trim();
    results.push({
      input: tc.input,
      expected,
      actual,
      passed: result.ok && actual === expected,
      error: result.ok ? null : result.output,
    });
  }

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;
  const timestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });

  // Update session
  const sessionIdx = store.sessions.findIndex(s => s.id === session.id);
  store.sessions[sessionIdx] = {
    ...store.sessions[sessionIdx],
    status: 'submitted',
    submission: { code, language, results, passed, total, allPassed, timestamp },
  };

  // If all passed → timeout the paired session
  if (allPassed) {
    const pairedIdx = store.sessions.findIndex(s => s.id === session.pairedWith);
    if (pairedIdx !== -1 && !store.sessions[pairedIdx].submission?.allPassed) {
      store.sessions[pairedIdx] = {
        ...store.sessions[pairedIdx],
        timedOut: true,
        status: 'timedout',
      };
    }
  }

  res.json({ passed, total, allPassed, timestamp, results });
});

module.exports = router;
