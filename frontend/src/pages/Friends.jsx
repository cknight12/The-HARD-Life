import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Avatar from '../components/Avatar';
import './Friends.css';

function FriendRow({ friend }) {
  const [expanded, setExpanded] = useState(false);
  const completedToday = friend.habits.filter(h => h.completedToday).length;
  const totalHabits = friend.habits.length;
  const maxStreak = friend.habits.reduce((m, h) => Math.max(m, h.streak), 0);

  return (
    <div className="friend-row">
      <div className="friend-row-header" onClick={() => setExpanded(e => !e)}>
        <Avatar name={friend.name} avatarUrl={friend.avatarUrl} size={36} radius={4} />
        <div className="friend-row-info">
          <div className="friend-row-name">{friend.name}</div>
          {friend.motto && <div className="friend-motto">{friend.motto}</div>}
          {friend.status && <div className="friend-status">{friend.status}</div>}
          <div className="friend-row-meta">
            {totalHabits > 0
              ? `${completedToday} of ${totalHabits} habits done today`
              : 'No habits'}
          </div>
        </div>
        <div className="friend-row-stats">
          {maxStreak > 0 && (
            <span className="friend-streak-badge">{maxStreak}d</span>
          )}
          <span className={`friend-chevron ${expanded ? 'open' : ''}`}>&#9660;</span>
        </div>
      </div>

      {expanded && (
        <div className="friend-habits">
          {friend.habits.length === 0 ? (
            <div className="friend-no-habits">No habits to display.</div>
          ) : (
            <>
              <div className="friend-habits-head">
                <div className="fth">Habit</div>
                <div className="fth fth-right">Streak</div>
                <div className="fth fth-center">Done</div>
              </div>
              {friend.habits.map(h => (
                <div key={h.id} className="friend-habit-row">
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addMsg, setAddMsg] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [friendsRes, reqRes] = await Promise.all([
        axios.get('/api/friends'),
        axios.get('/api/friends/requests'),
      ]);
      setFriends(friendsRes.data);
      setRequests(reqRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const sendRequest = async (e) => {
    e.preventDefault();
    setAddError(''); setAddMsg('');
    setAddLoading(true);
    try {
      const { data } = await axios.post('/api/friends/request', { email: addEmail });
      setAddMsg(data.message);
      setAddEmail('');
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to send request');
    } finally {
      setAddLoading(false);
    }
  };

  const acceptRequest = async (id) => {
    await axios.put(`/api/friends/request/${id}/accept`);
    fetchAll();
  };

  const declineRequest = async (id) => {
    await axios.delete(`/api/friends/${id}`);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="page">
      <div className="friends-header">
        <div>
          <h1 className="page-title">Friends</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Growth happens best in the context of community.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add friend</button>
      </div>

      {requests.length > 0 && (
        <div className="requests-section">
          <div className="section-header" style={{ marginBottom: 10 }}>
            <span className="section-title">Pending requests</span>
          </div>
          {requests.map(r => (
            <div key={r.id} className="request-row">
              <Avatar name={r.name} avatarUrl={r.avatarUrl} size={32} radius={4} />
              <div className="request-info">
                <div className="request-name">{r.name}</div>
                {r.motto && <div className="request-motto">{r.motto}</div>}
                <div className="request-email">{r.email}</div>
              </div>
              <div className="request-actions">
                <button className="btn btn-primary btn-sm" onClick={() => acceptRequest(r.id)}>Accept</button>
                <button className="btn btn-ghost btn-sm" onClick={() => declineRequest(r.id)}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-header" style={{ marginBottom: 10 }}>
        <span className="section-title">Connections</span>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading...</p></div>
      ) : friends.length === 0 ? (
        <div className="empty-state">
          <h3>No connections yet</h3>
          <p>Add a friend by email to start sharing progress and building accountability.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setShowAddModal(true)}>
            Add friend
          </button>
        </div>
      ) : (
        <div className="friends-list">
          {friends.map(f => <FriendRow key={f.id} friend={f} />)}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal">
            <h2 className="modal-title">Add friend</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 18, lineHeight: 1.5 }}>
              Enter their registered email address to send a connection request.
            </p>
            {addError && <div className="error-msg">{addError}</div>}
            {addMsg && <div className="success-msg">{addMsg}</div>}
            <form onSubmit={sendRequest}>
              <div className="form-group">
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="friend@example.com"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost"
                  onClick={() => { setShowAddModal(false); setAddMsg(''); setAddError(''); }}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                  {addLoading ? 'Sending...' : 'Send request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
