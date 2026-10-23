const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Built-in heuristic fallback engine
function fallbackRegexReview(diffText) {
  const findings = [];
  const lines = diffText.split('\n');
  let currentFile = 'unknown';
  let lineNo = 0;

  for (const rawLine of lines) {
    if (rawLine.startsWith('+++ b/')) {
      currentFile = rawLine.replace('+++ b/', '').trim();
    } else if (rawLine.startsWith('@@')) {
      const match = rawLine.match(/\+(\d+)/);
      if (match) lineNo = parseInt(match[1], 10) - 1;
    } else if (rawLine.startsWith('+') && !rawLine.startsWith('+++')) {
      lineNo++;
      const code = rawLine.slice(1);

      if (/(api_?key|secret|password|token)\s*=\s*['"][A-Za-z0-9_-]{8,}['"]/i.test(code)) {
        findings.push({
          file: currentFile,
          line: lineNo,
          severity: 'CRITICAL',
          issue: 'Hardcoded secret or credential detected in source.',
          fix: 'Store sensitive keys in environment variables or a secret vault.'
        });
      }

      if (/(SELECT|INSERT|UPDATE|DELETE).*\$\{.*\}|(SELECT|INSERT|UPDATE|DELETE).*f['"]/i.test(code)) {
        findings.push({
          file: currentFile,
          line: lineNo,
          severity: 'CRITICAL',
          issue: 'Direct string interpolation in SQL query risks SQL injection.',
          fix: 'Use parameterized queries or ORM sanitization.'
        });
      }

      if (/console\.log\(|DEBUG\s*=\s*true/i.test(code)) {
        findings.push({
          file: currentFile,
          line: lineNo,
          severity: 'WARNING',
          issue: 'Production debug statement or flag detected.',
          fix: 'Remove logging or guard with environment check before merging.'
        });
      }
    } else if (!rawLine.startsWith('-')) {
      lineNo++;
    }
  }

  return findings;
}

// API Route
app.post('/api/review', async (req, res) => {
  const { diff, model = 'codellama:7b' } = req.body;

  if (!diff || !diff.trim()) {
    return res.status(400).json({ error: 'Diff content cannot be empty.' });
  }

  const prompt = `You are a strict security and code quality auditor for pull requests.
Analyze the following git diff carefully line by line.
Check for hardcoded secrets, SQL injection, logic flaws, and code smells.
Return a valid JSON array of objects matching this schema:
[
  {
    "file": "string",
    "line": 0,
    "severity": "CRITICAL" | "WARNING" | "SUGGESTION" | "STYLE",
    "issue": "concise description",
    "fix": "recommended replacement or change"
  }
]
Output valid JSON only.

Diff to review:
${diff}`;

  // 1. Try Ollama (if running on local machine or remote tunnel)
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        format: 'json'
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json();
      let parsed = JSON.parse(data.response);
      let reviews = Array.isArray(parsed) ? parsed : (Object.values(parsed).find(v => Array.isArray(v)) || [parsed]);
      return res.json({ source: 'ollama (local engine)', reviews });
    }
  } catch (err) {
    // Continue to fallback
  }

  // 2. Automated Fail-Safe Heuristic Engine
  const fallbackReviews = fallbackRegexReview(diff);
  return res.json({ source: 'open-source heuristic engine', reviews: fallbackReviews });
});

// Serve frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});