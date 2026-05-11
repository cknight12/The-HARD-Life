const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');
const { calcStreak } = require('./habits');

const router = express.Router();
router.use(auth);

const FRIEND_FIELDS = 'id, name, email, bio, motto, status, avatarUrl';

function getFriendIds(userId) {
  return db.prepare(`
    SELECT CASE WHEN userId1 = ? THEN userId2 ELSE userId1 END AS friendId
    FROM friendships
    WHERE (userId1 = ? OR userId2 = ?) AND status = 'accepted'
  `).all(userId, userId, userId).map(r => r.friendId);
}

function enrichHabits(userId) {
  const habits = db.prepare('SELECT * FROM habits WHERE userId = ?').all(userId);
  const today = new Date().toISOString().slice(0, 10);
  return habits.map(h => {
    const streak = calcStreak(h.id);
    const todayLog = db.prepare(
      'SELECT completed FROM habit_logs WHERE habitId = ? AND date = ?'
    ).get(h.id, today);
    return { ...h, streak, completedToday: todayLog?.completed === 1 };
  });
}

router.get('/', (req, res) => {
  const friendIds = getFriendIds(req.user.id);
  const friends = friendIds.map(fid => {
    const user = db.prepare(`SELECT ${FRIEND_FIELDS} FROM users WHERE id = ?`).get(fid);
    return { ...user, habits: enrichHabits(fid) };
  });
  res.json(friends);
});

router.get('/requests', (req, res) => {
  const requests = db.prepare(`
    SELECT f.id, f.userId1, f.createdAt, u.name, u.email, u.motto, u.avatarUrl
    FROM friendships f
    JOIN users u ON u.id = f.userId1
    WHERE f.userId2 = ? AND f.status = 'pending'
  `).all(req.user.id);
  res.json(requests);
});

router.post('/request', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const target = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' });

  const existing = db.prepare(`
    SELECT * FROM friendships
    WHERE (userId1 = ? AND userId2 = ?) OR (userId1 = ? AND userId2 = ?)
  `).get(req.user.id, target.id, target.id, req.user.id);

  if (existing) {
    if (existing.status === 'accepted') return res.status(409).json({ error: 'Already friends' });
    return res.status(409).json({ error: 'Request already sent' });
  }

  db.prepare('INSERT INTO friendships (userId1, userId2, status) VALUES (?, ?, ?)').run(req.user.id, target.id, 'pending');
  res.status(201).json({ message: `Friend request sent to ${target.name}` });
});

router.put('/request/:id/accept', (req, res) => {
  const friendship = db.prepare(
    'SELECT * FROM friendships WHERE id = ? AND userId2 = ? AND status = ?'
  ).get(req.params.id, req.user.id, 'pending');

  if (!friendship) return res.status(404).json({ error: 'Request not found' });
  db.prepare('UPDATE friendships SET status = ? WHERE id = ?').run('accepted', friendship.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const friendship = db.prepare(`
    SELECT * FROM friendships WHERE id = ? AND (userId1 = ? OR userId2 = ?)
  `).get(req.params.id, req.user.id, req.user.id);

  if (!friendship) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM friendships WHERE id = ?').run(friendship.id);
  res.json({ success: true });
});

router.get('/:friendId/progress', (req, res) => {
  const friendIds = getFriendIds(req.user.id);
  const fid = parseInt(req.params.friendId);
  if (!friendIds.includes(fid)) return res.status(403).json({ error: 'Not your friend' });

  const user = db.prepare(`SELECT ${FRIEND_FIELDS} FROM users WHERE id = ?`).get(fid);
  const goals = db.prepare('SELECT * FROM goals WHERE userId = ?').all(fid);
  res.json({ ...user, habits: enrichHabits(fid), goals });
});

module.exports = router;
