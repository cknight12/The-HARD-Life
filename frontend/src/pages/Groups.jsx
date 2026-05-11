import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import './Groups.css';

function GroupDetail({ group, currentUserId, onClose, onUpdated }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteErr, setInviteErr] = useState('');
  const [saveErr, setSaveErr] = useState('');

  const isOwner = detail?.ownerId === currentUserId;

  const fetchDetail = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/groups/${group.id}`);
      setDetail(data);
      setEditName(data.name);
      setEditDesc(data.description || '');
    } finally {
      setLoading(false);
    }
  }, [group.id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaveErr('');
    try {
      const { data } = await axios.put(`/api/groups/${group.id}`, { name: editName, description: editDesc });
      setDetail(prev => ({ ...prev, ...data }));
      onUpdated(data);
      setEditing(false);
    } catch (err) {
      setSaveErr(err.response?.data?.error || 'Failed to save');
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    setInviteErr(''); setInviteMsg('');
    try {
      const { data } = await axios.post(`/api/groups/${group.id}/members`, { email: inviteEmail });
      setInviteMsg(data.message);
      setInviteEmail('');
      fetchDetail();
    } catch (err) {
      setInviteErr(err.response?.data?.error || 'Failed to invite');
    }
  };

  const removeMember = async (uid) => {
    if (!confirm('Remove this member?')) return;
    await axios.delete(`/api/groups/${group.id}/members/${uid}`);
    fetchDetail();
  };

  if (loading) return (
    <div className="group-detail">
      <button className="detail-back" onClick={onClose}>← Back to groups</button>
      <div className="empty-state"><p>Loading...</p></div>
    </div>
  );

  return (
    <div className="group-detail">
      <button className="detail-back" onClick={onClose}>← Back to groups</button>

      <div className="detail-header">
        {editing ? (
          <form onSubmit={saveEdit} className="edit-form">
            {saveErr && <div className="error-msg">{saveErr}</div>}
            <div className="form-group">
              <label className="label">Group name</label>
              <input className="input" value={editName} onChange={e => setEditName(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input" value={editDesc} onChange={e => setEditDesc(e.target.value)}
                rows={3} style={{ resize: 'vertical' }} placeholder="What is this group about?" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary btn-sm">Save</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div className="detail-title-row">
              <h2 className="detail-title">{detail.name}</h2>
              {isOwner && (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
              )}
            </div>
            {detail.description && <p className="detail-description">{detail.description}</p>}
            <div className="detail-meta">
              <span>{detail.memberCount} {detail.memberCount === 1 ? 'member' : 'members'}</span>
              <span className="meta-dot">·</span>
              <span>Owned by {detail.ownerName}</span>
            </div>
          </>
        )}
      </div>

      {/* Invite */}
      <div className="detail-section">
        <div className="section-header" style={{ marginBottom: 10 }}>
          <span className="section-title">Invite member</span>
        </div>
        {inviteErr && <div className="error-msg">{inviteErr}</div>}
        {inviteMsg && <div className="success-msg">{inviteMsg}</div>}
        <form onSubmit={sendInvite} className="invite-form">
          <input
            type="email"
            className="input"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="member@example.com"
            required
          />
          <button type="submit" className="btn btn-primary btn-sm">Add</button>
        </form>
      </div>

      {/* Members */}
      <div className="detail-section">
        <div className="section-header" style={{ marginBottom: 10 }}>
          <span className="section-title">Members</span>
        </div>
        <div className="members-list">
          {detail.members.map(m => (
            <MemberRow key={m.id} member={m} isOwner={isOwner} currentUserId={currentUserId}
              groupOwnerId={detail.ownerId} onRemove={removeMember} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member, isOwner, currentUserId, groupOwnerId, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const completedToday = member.habits.filter(h => h.completedToday).length;
  const maxStreak = member.habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const canRemove = (isOwner && member.id !== groupOwnerId) || member.id === currentUserId;

  return (
    <div className="member-row">
      <div className="member-row-header" onClick={() => member.habits.length > 0 && setExpanded(e => !e)}>
        <Avatar name={member.name} avatarUrl={member.avatarUrl} size={34} radius={4} />
        <div className="member-info">
          <div className="member-name-row">
            <span className="member-name">{member.name}</span>
            {member.role === 'owner' && <span className="owner-badge">owner</span>}
          </div>
          {member.motto && <div className="member-motto">{member.motto}</div>}
          {member.status && <div className="member-status">{member.status}</div>}
          <div className="member-meta">
            {member.habits.length > 0
              ? `${completedToday}/${member.habits.length} done today`
              : 'No habits'}
          </div>
        </div>
        <div className="member-row-right">
          {maxStreak > 0 && <span className="member-streak">{maxStreak}d</span>}
          {canRemove && (
            <button className="row-btn row-btn-delete" onClick={e => { e.stopPropagation(); onRemove(member.id); }}>
              {member.id === currentUserId ? 'Leave' : 'Remove'}
            </button>
          )}
          {member.habits.length > 0 && (
            <span className={`friend-chevron ${expanded ? 'open' : ''}`}>&#9660;</span>
          )}
        </div>
      </div>

      {expanded && member.habits.length > 0 && (
        <div className="member-habits">
          <div className="friend-habits-head" style={{ paddingLeft: 58 }}>
            <div className="fth">Habit</div>
            <div className="fth fth-right">Streak</div>
            <div className="fth fth-center">Done</div>
          </div>
          {member.habits.map(h => (
            <div key={h.id} className="friend-habit-row" style={{ paddingLeft: 58 }}>
              <div className="fh-name-cell">
                <div className="fh-dot" style={{ background: h.color }} />
                <span className="fh-name">{h.name}</span>
              </div>
              <div className={`fh-streak ${h.streak >= 3 ? 'hot' : ''}`}>{h.streak}d</div>
              <div className="fh-status">
                <span className={`fh-check ${h.completedToday ? 'done' : 'pending'}`}>
                  {h.completedToday ? '✓' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createErr, setCreateErr] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/groups');
      setGroups(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const createGroup = async (e) => {
    e.preventDefault();
    setCreateErr('');
    setCreating(true);
    try {
      const { data } = await axios.post('/api/groups', { name: createName, description: createDesc });
      setGroups(prev => [data, ...prev]);
      setShowCreateModal(false);
      setCreateName(''); setCreateDesc('');
      setSelectedGroup(data);
    } catch (err) {
      setCreateErr(err.response?.data?.error || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const handleGroupUpdated = (updated) => {
    setGroups(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g));
    setSelectedGroup(prev => ({ ...prev, ...updated }));
  };

  if (selectedGroup) {
    return (
      <div className="page">
        <GroupDetail
          group={selectedGroup}
          currentUserId={user?.id}
          onClose={() => setSelectedGroup(null)}
          onUpdated={handleGroupUpdated}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="groups-header">
        <div>
          <h1 className="page-title">Groups</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Shared accountability with a team.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ New group</button>
      </div>

      <div className="section-header" style={{ marginBottom: 10 }}>
        <span className="section-title">My groups</span>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading...</p></div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <h3>No groups yet</h3>
          <p>Create a group or ask someone to add you to theirs.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setShowCreateModal(true)}>
            Create group
          </button>
        </div>
      ) : (
        <div className="groups-list">
          {groups.map(g => (
            <button key={g.id} className="group-card" onClick={() => setSelectedGroup(g)}>
              <div className="group-card-top">
                <div className="group-name">{g.name}</div>
                <span className="group-member-count">{g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}</span>
              </div>
              {g.description && (
                <div className="group-description">{g.description}</div>
              )}
              <div className="group-card-meta">
                Owned by {g.ownerName}
                {g.ownerId === user?.id && <span className="owner-badge" style={{ marginLeft: 8 }}>you</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal">
            <h2 className="modal-title">New group</h2>
            {createErr && <div className="error-msg">{createErr}</div>}
            <form onSubmit={createGroup}>
              <div className="form-group">
                <label className="label">Group name</label>
                <input className="input" value={createName} onChange={e => setCreateName(e.target.value)}
                  placeholder="e.g. Morning Crew" required autoFocus />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea className="input" value={createDesc} onChange={e => setCreateDesc(e.target.value)}
                  rows={3} style={{ resize: 'vertical' }}
                  placeholder="What is this group's focus? What are you all working toward together?" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
