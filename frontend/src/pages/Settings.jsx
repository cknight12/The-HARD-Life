import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import './Settings.css';

function CharCount({ value, max }) {
  const len = value?.length || 0;
  const over = len > max;
  return (
    <span style={{ fontSize: '0.7rem', color: over ? 'var(--danger)' : 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
      {len}/{max}
    </span>
  );
}

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [motto, setMotto] = useState(user?.motto || '');
  const [status, setStatus] = useState(user?.status || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (motto.length > 140) { setError('Motto must be 140 characters or fewer'); return; }
    if (status.length > 280) { setError('Status must be 280 characters or fewer'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      await updateProfile({ name: name.trim(), motto: motto.trim(), status: status.trim(), avatarUrl: avatarUrl.trim(), bio: bio.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Manage your profile and account.</p>

      <div className="settings-layout">

        {/* Profile section */}
        <div className="settings-section">
          <div className="settings-section-label">Profile</div>

          <div className="profile-identity">
            <Avatar name={name || user?.name} avatarUrl={avatarUrl} size={52} radius={4} />
            <div>
              <div className="profile-name">{name || user?.name}</div>
              {motto && <div className="profile-motto">{motto}</div>}
              {status && <div className="profile-status">{status}</div>}
              <div className="profile-email">{user?.email}</div>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}
          {saved && <div className="success-msg">Changes saved.</div>}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="label">Display name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label className="label">Motto</label>
                <CharCount value={motto} max={140} />
              </div>
              <input
                className="input"
                value={motto}
                onChange={e => setMotto(e.target.value)}
                placeholder="e.g. Consistency over intensity"
                maxLength={145}
              />
              <div className="field-hint">A short phrase that defines your approach. Shown on your profile and friend cards.</div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label className="label">Daily intention</label>
                <CharCount value={status} max={280} />
              </div>
              <input
                className="input"
                value={status}
                onChange={e => setStatus(e.target.value)}
                placeholder="What are you focused on today?"
                maxLength={285}
              />
              <div className="field-hint">Change this as often as you want. Visible to friends.</div>
            </div>

            <div className="form-group">
              <label className="label">Avatar URL</label>
              <input
                type="url"
                className="input"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/your-photo.jpg"
              />
              <div className="field-hint">Link to a publicly accessible image. Leave blank to use your initial.</div>
            </div>

            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" value={user?.email || ''} disabled />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving || motto.length > 140 || status.length > 280}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* About */}
        <div className="settings-section">
          <div className="settings-section-label">About</div>
          <div className="about-wordmark">The HARD Life</div>
          <div className="about-quote">
            "Growth happens best in the context of community."
          </div>
          <p className="about-body">
            Habit and goal tracking for people who take their growth seriously.
            No gamification, no social feed. Just daily execution and accountability.
            The hardest paths are the most rewarding — this app is designed for those who choose them.
          </p>
        </div>

        {/* Account */}
        <div className="settings-section">
          <div className="settings-section-label">Account</div>
          <div className="danger-row">
            <div>
              <div className="danger-label">Sign out</div>
              <div className="danger-desc">You will need your password to sign back in.</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={logout}>Sign out</button>
          </div>
        </div>

      </div>
    </div>
  );
}
