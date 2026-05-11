const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');
const { calcStreak } = require('./habits');

const router = express.Router();
router.use(auth);

const MEMBER_FIELDS = 'u.id, u.name, u.email, u.motto, u.status, u.avatarUrl';

function enrichHabits(userId) {
  const habits = db.prepare('SELECT * FROM habits WHERE userId = ?').all(userId);
  const today = new Date().toISOString().slice(0, 10);
  return habits.map(h => {
    const streak = calcStreak(h.id);
    const log = db.prepare('SELECT completed FROM habit_logs WHERE habitId = ? AND date = ?').get(h.id, today);
    return { ...h, streak, completedToday: log?.completed === 1 };
  });
}

function isMember(groupId, userId) {
  return !!db.prepare('SELECT id FROM group_members WHERE groupId = ? AND userId = ?').get(groupId, userId);
}

function isOwner(groupId, userId) {
  return !!db.prepare('SELECT id FROM groups WHERE id = ? AND ownerId = ?').get(groupId, userId);
}

// List groups I belong to
router.get('/', (req, res) => {
  const groups = db.prepare(`
    SELECT g.id, g.name, g.description, g.ownerId, g.createdAt,
           (SELECT COUNT(*) FROM group_members WHERE groupId = g.id) AS memberCount,
           u.name AS ownerName
    FROM groups g
    JOIN group_members gm ON gm.groupId = g.id AND gm.userId = ?
    JOIN users u ON u.id = g.ownerId
    ORDER BY g.createdAt DESC
  `).all(req.user.id);
  res.json(groups);
});

// Get group detail with members + their habits
router.get('/:id', (req, res) => {
  if (!isMember(req.params.id, req.user.id)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  const group = db.prepare(`
    SELECT g.*, u.name AS ownerName,
           (SELECT COUNT(*) FROM group_members WHERE groupId = g.id) AS memberCount
    FROM groups g JOIN users u ON u.id = g.ownerId
    WHERE g.id = ?
  `).get(req.params.id);

  if (!group) return res.status(404).json({ error: 'Group not found' });

  const members = db.prepare(`
    SELECT ${MEMBER_FIELDS}, gm.role, gm.joinedAt
    FROM group_members gm
    JOIN users u ON u.id = gm.userId
    WHERE gm.groupId = ?
    ORDER BY gm.role DESC, gm.joinedAt ASC
  `).all(req.params.id);

  const today = new Date().toISOString().slice(0, 10);
  const enriched = members.map(m => ({ ...m, habits: enrichHabits(m.id) }));

  res.json({ ...group, members: enriched });
});

// Create group (creator becomes owner + member)
router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });

  const result = db.prepare(
    'INSERT INTO groups (name, description, ownerId) VALUES (?, ?, ?)'
  ).run(name.trim(), description?.trim() || '', req.user.id);

  db.prepare(
    'INSERT INTO group_members (groupId, userId, role) VALUES (?, ?, ?)'
  ).run(result.lastInsertRowid, req.user.id, 'owner');

  const group = db.prepare(`
    SELECT g.*, u.name AS ownerName,
           (SELECT COUNT(*) FROM group_members WHERE groupId = g.id) AS memberCount
    FROM groups g JOIN users u ON u.id = g.ownerId WHERE g.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(group);
});

// Edit group (owner only)
router.put('/:id', (req, res) => {
  if (!isOwner(req.params.id, req.user.id)) {
    return res.status(403).json({ error: 'Only the owner can edit this group' });
  }

  const { name, description } = req.body;
  db.prepare('UPDATE groups SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?')
    .run(name?.trim() || null, description !== undefined ? description.trim() : null, req.params.id);

  const group = db.prepare(`
    SELECT g.*, u.name AS ownerName,
           (SELECT COUNT(*) FROM group_members WHERE groupId = g.id) AS memberCount
    FROM groups g JOIN users u ON u.id = g.ownerId WHERE g.id = ?
  `).get(req.params.id);

  res.json(group);
});

// Delete group (owner only)
router.delete('/:id', (req, res) => {
  if (!isOwner(req.params.id, req.user.id)) {
    return res.status(403).json({ error: 'Only the owner can delete this group' });
  }
  db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Invite member by email
router.post('/:id/members', (req, res) => {
  if (!isMember(req.params.id, req.user.id)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const target = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const existing = db.prepare('SELECT id FROM group_members WHERE groupId = ? AND userId = ?')
    .get(req.params.id, target.id);
  if (existing) return res.status(409).json({ error: `${target.name} is already in this group` });

  db.prepare('INSERT INTO group_members (groupId, userId, role) VALUES (?, ?, ?)').run(req.params.id, target.id, 'member');
  res.status(201).json({ message: `${target.name} added to group` });
});

// Remove member (owner can remove anyone; members can remove themselves)
router.delete('/:id/members/:userId', (req, res) => {
  const gid = req.params.id;
  const uid = parseInt(req.params.userId);

  if (uid !== req.user.id && !isOwner(gid, req.user.id)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (uid === req.user.id && isOwner(gid, req.user.id)) {
    return res.status(400).json({ error: 'Owner cannot leave — transfer ownership or delete the group' });
  }

  db.prepare('DELETE FROM group_members WHERE groupId = ? AND userId = ?').run(gid, uid);
  res.json({ success: true });
});

module.exports = router;
