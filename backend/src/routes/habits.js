const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

function calcStreak(habitId) {
  const logs = db.prepare(
    'SELECT date FROM habit_logs WHERE habitId = ? AND completed = 1 ORDER BY date DESC'
  ).all(habitId);

  if (!logs.length) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let streak = 0;
  let current = logs[0].date === today ? today : (logs[0].date === yesterday ? yesterday : null);
  if (!current) return 0;

  for (const log of logs) {
    if (log.date === current) {
      streak++;
      const d = new Date(current);
      d.setDate(d.getDate() - 1);
      current = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
}

router.get('/', (req, res) => {
  const habits = db.prepare('SELECT * FROM habits WHERE userId = ? ORDER BY createdAt DESC').all(req.user.id);
  const today = new Date().toISOString().slice(0, 10);

  const enriched = habits.map(h => {
    const streak = calcStreak(h.id);
    const todayLog = db.prepare(
      'SELECT completed FROM habit_logs WHERE habitId = ? AND date = ?'
    ).get(h.id, today);
    return { ...h, streak, completedToday: todayLog?.completed === 1 };
  });
  res.json(enriched);
});

router.post('/', (req, res) => {
  const { name, description, color, frequency } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const result = db.prepare(
    'INSERT INTO habits (userId, name, description, color, frequency) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.id, name, description || '', color || '#6C63FF', frequency || 'daily');

  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...habit, streak: 0, completedToday: false });
});

router.put('/:id', (req, res) => {
  const { name, description, color, frequency } = req.body;
  const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  db.prepare(
    'UPDATE habits SET name = ?, description = ?, color = ?, frequency = ? WHERE id = ?'
  ).run(
    name || habit.name,
    description !== undefined ? description : habit.description,
    color || habit.color,
    frequency || habit.frequency,
    habit.id
  );

  const updated = db.prepare('SELECT * FROM habits WHERE id = ?').get(habit.id);
  res.json({ ...updated, streak: calcStreak(habit.id) });
});

router.delete('/:id', (req, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  db.prepare('DELETE FROM habits WHERE id = ?').run(habit.id);
  res.json({ success: true });
});

// Toggle completion for today
router.post('/:id/log', (req, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const existing = db.prepare('SELECT * FROM habit_logs WHERE habitId = ? AND date = ?').get(habit.id, date);

  if (existing) {
    db.prepare('UPDATE habit_logs SET completed = ? WHERE id = ?').run(existing.completed ? 0 : 1, existing.id);
  } else {
    db.prepare('INSERT INTO habit_logs (habitId, date, completed) VALUES (?, ?, 1)').run(habit.id, date);
  }

  const streak = calcStreak(habit.id);
  const log = db.prepare('SELECT * FROM habit_logs WHERE habitId = ? AND date = ?').get(habit.id, date);
  res.json({ completed: log.completed === 1, streak });
});

// Get logs for date range
router.get('/:id/logs', (req, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const { from, to } = req.query;
  let logs;
  if (from && to) {
    logs = db.prepare('SELECT * FROM habit_logs WHERE habitId = ? AND date BETWEEN ? AND ?').all(habit.id, from, to);
  } else {
    logs = db.prepare('SELECT * FROM habit_logs WHERE habitId = ? ORDER BY date DESC LIMIT 30').all(habit.id);
  }
  res.json(logs);
});

module.exports = { router, calcStreak };
