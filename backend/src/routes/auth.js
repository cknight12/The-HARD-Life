const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hardlife_secret_2024';

const PUBLIC_FIELDS = 'id, email, name, bio, motto, status, avatarUrl, createdAt';

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
    ).run(email, hashed, name);

    const token = jwt.sign({ id: result.lastInsertRowid, email, name }, JWT_SECRET, { expiresIn: '30d' });
    const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, row.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: row.id, email: row.email, name: row.name }, JWT_SECRET, { expiresIn: '30d' });
    const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(row.id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.put('/me', authMiddleware, (req, res) => {
  const { name, bio, motto, status, avatarUrl } = req.body;

  if (motto && motto.length > 140) return res.status(400).json({ error: 'Motto must be 140 characters or fewer' });
  if (status && status.length > 280) return res.status(400).json({ error: 'Status must be 280 characters or fewer' });

  db.prepare(`
    UPDATE users SET
      name     = COALESCE(?, name),
      bio      = COALESCE(?, bio),
      motto    = CASE WHEN ? IS NOT NULL THEN ? ELSE motto END,
      status   = CASE WHEN ? IS NOT NULL THEN ? ELSE status END,
      avatarUrl = CASE WHEN ? IS NOT NULL THEN ? ELSE avatarUrl END
    WHERE id = ?
  `).run(
    name || null,
    bio !== undefined ? bio : null,
    motto !== undefined ? motto : null, motto !== undefined ? motto : null,
    status !== undefined ? status : null, status !== undefined ? status : null,
    avatarUrl !== undefined ? avatarUrl : null, avatarUrl !== undefined ? avatarUrl : null,
    req.user.id
  );

  const updated = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(req.user.id);
  res.json(updated);
});

module.exports = router;
