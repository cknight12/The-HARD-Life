const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', (req, res) => {
  const goals = db.prepare('SELECT * FROM goals WHERE userId = ? ORDER BY createdAt DESC').all(req.user.id);
  res.json(goals);
});

router.post('/', (req, res) => {
  const { name, description, targetDate } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const result = db.prepare(
    'INSERT INTO goals (userId, name, description, targetDate) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, name, description || '', targetDate || null);

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(goal);
});

router.put('/:id', (req, res) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const { name, description, targetDate, progress, completed } = req.body;
  db.prepare(
    'UPDATE goals SET name = ?, description = ?, targetDate = ?, progress = ?, completed = ? WHERE id = ?'
  ).run(
    name || goal.name,
    description !== undefined ? description : goal.description,
    targetDate !== undefined ? targetDate : goal.targetDate,
    progress !== undefined ? Math.min(100, Math.max(0, progress)) : goal.progress,
    completed !== undefined ? (completed ? 1 : 0) : goal.completed,
    goal.id
  );

  res.json(db.prepare('SELECT * FROM goals WHERE id = ?').get(goal.id));
});

router.delete('/:id', (req, res) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  db.prepare('DELETE FROM goals WHERE id = ?').run(goal.id);
  res.json({ success: true });
});

module.exports = router;
