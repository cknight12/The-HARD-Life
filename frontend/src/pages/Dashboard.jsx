import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const COLORS = ['#FF7043','#BDBDBD','#78909C','#A5D6A7','#80DEEA','#CE93D8','#FFCC80','#EF9A9A'];

function HabitModal({ habit, onClose, onSave }) {
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [color, setColor] = useState(habit?.color || COLORS[0]);
  const [frequency, setFrequency] = useState(habit?.frequency || 'daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    try {
      await onSave({ name: name.trim(), description: description.trim(), color, frequency });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{habit ? 'Edit habit' : 'New habit'}</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="label">Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning workout" autoFocus />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label className="label">Frequency</label>
            <select className="input" value={frequency} onChange={e => setFrequency(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Color marker</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <button key={c} type="button"
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : habit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GoalModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    try {
      await onSave({ name: name.trim(), description: description.trim(), targetDate: targetDate || null });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">New goal</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="label">Goal</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Complete a half marathon" autoFocus />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label className="label">Target date</label>
            <input type="date" className="input" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const completedToday = habits.filter(h => h.completedToday).length;
  const maxStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const activeGoals = goals.filter(g => !g.completed).length;

  const fetchHabits = useCallback(async () => {
    const { data } = await axios.get('/api/habits');
    setHabits(data);
    setLoading(false);
  }, []);

  const fetchGoals = useCallback(async () => {
    const { data } = await axios.get('/api/goals');
    setGoals(data);
  }, []);

  useEffect(() => { fetchHabits(); fetchGoals(); }, [fetchHabits, fetchGoals]);

  const toggleHabit = async (id) => {
    const { data } = await axios.post(`/api/habits/${id}/log`);
    setHabits(prev => prev.map(h =>
      h.id === id ? { ...h, completedToday: data.completed, streak: data.streak } : h
    ));
  };

  const deleteHabit = async (id) => {
    if (!confirm('Delete this habit? Streak data will be lost.')) return;
    await axios.delete(`/api/habits/${id}`);
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const saveHabit = async (data) => {
    if (editingHabit) {
      const res = await axios.put(`/api/habits/${editingHabit.id}`, data);
      setHabits(prev => prev.map(h =>
        h.id === editingHabit.id ? { ...res.data, completedToday: h.completedToday } : h
      ));
      setEditingHabit(null);
    } else {
      const res = await axios.post('/api/habits', data);
      setHabits(prev => [...prev, res.data]);
    }
  };

  const updateGoal = async (id, data) => {
    const res = await axios.put(`/api/goals/${id}`, data);
    setGoals(prev => prev.map(g => g.id === id ? res.data : g));
  };

  const deleteGoal = async (id) => {
    if (!confirm('Delete this goal?')) return;
    await axios.delete(`/api/goals/${id}`);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const saveGoal = async (data) => {
    const res = await axios.post('/api/goals', data);
    setGoals(prev => [...prev, res.data]);
  };

  const openEdit = (habit) => { setEditingHabit(habit); setShowHabitModal(true); };
  const closeHabitModal = () => { setShowHabitModal(false); setEditingHabit(null); };

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <div className="greeting">{timeOfDay}, {user?.name?.split(' ')[0]}</div>
          <div className="greeting-date">{today}</div>
        </div>
        {habits.length > 0 && (
          <div className="header-meta">
            <div className="meta-stat">
              <div className="meta-stat-value stat-num">{completedToday}/{habits.length}</div>
              <div className="meta-stat-label">Done today</div>
            </div>
            {maxStreak > 0 && (
              <>
                <div className="meta-divider" />
                <div className="meta-stat">
                  <div className="meta-stat-value stat-num">{maxStreak}</div>
                  <div className="meta-stat-label">Best streak</div>
                </div>
              </>
            )}
            {activeGoals > 0 && (
              <>
                <div className="meta-divider" />
                <div className="meta-stat">
                  <div className="meta-stat-value stat-num">{activeGoals}</div>
                  <div className="meta-stat-label">Active goals</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {habits.length > 0 && (
        <div className="daily-bar">
          <div className="daily-bar-header">
            <span className="daily-bar-label">Today</span>
            <span className="daily-bar-count stat-num">{completedToday} / {habits.length} habits</span>
          </div>
          <div className="progress-bar" style={{ height: 3 }}>
            <div className="progress-bar-fill" style={{ width: `${habits.length > 0 ? (completedToday / habits.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Habits */}
      <section className="dashboard-section">
        <div className="section-header">
          <span className="section-title">Habits</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowHabitModal(true)}>+ New habit</button>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading...</p></div>
        ) : habits.length === 0 ? (
          <div className="empty-state">
            <h3>No habits yet</h3>
            <p>Add your first habit to start building streaks.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setShowHabitModal(true)}>
              Add habit
            </button>
          </div>
        ) : (
          <div className="habits-table">
            <div className="habits-table-head">
              <div className="th">Habit</div>
              <div className="th th-right">Streak</div>
              <div className="th th-center">Actions</div>
              <div className="th th-right">Today</div>
            </div>
            {habits.map(h => (
              <div key={h.id} className={`habit-row ${h.completedToday ? 'habit-done' : ''}`}>
                <div className="habit-row-name">
                  <div className="habit-color-bar" style={{ background: h.color }} />
                  <div>
                    <div className="habit-name-text">{h.name}</div>
                    {h.description && <div className="habit-desc-text">{h.description}</div>}
                  </div>
                </div>
                <div className={`habit-streak-cell stat-num ${h.streak >= 3 ? 'hot' : ''}`}>
                  {h.streak}d
                </div>
                <div className="habit-row-actions">
                  <button className="row-btn" onClick={() => openEdit(h)}>Edit</button>
                  <button className="row-btn row-btn-delete" onClick={() => deleteHabit(h.id)}>Del</button>
                </div>
                <div className="check-cell">
                  <button
                    className={`check-box ${h.completedToday ? 'checked' : ''}`}
                    onClick={() => toggleHabit(h.id)}
                    aria-label={h.completedToday ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {h.completedToday ? '✓' : ''}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Goals */}
      <section className="dashboard-section">
        <div className="section-header">
          <span className="section-title">Goals</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowGoalModal(true)}>+ New goal</button>
        </div>

        {goals.length === 0 ? (
          <div className="empty-state">
            <h3>No goals set</h3>
            <p>Define what you're working toward and track progress.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setShowGoalModal(true)}>
              Add goal
            </button>
          </div>
        ) : (
          <div className="goals-list">
            {goals.map(g => <GoalRow key={g.id} goal={g} onUpdate={updateGoal} onDelete={deleteGoal} />)}
          </div>
        )}
      </section>

      {showHabitModal && <HabitModal habit={editingHabit} onClose={closeHabitModal} onSave={saveHabit} />}
      {showGoalModal && <GoalModal onClose={() => setShowGoalModal(false)} onSave={saveGoal} />}
    </div>
  );
}

function GoalRow({ goal, onUpdate, onDelete }) {
  const [progress, setProgress] = useState(goal.progress);

  const daysLeft = goal.targetDate
    ? Math.ceil((new Date(goal.targetDate) - new Date()) / 86400000)
    : null;

  const metaText = goal.completed
    ? 'Completed'
    : daysLeft !== null
      ? daysLeft > 0 ? `${daysLeft}d remaining` : daysLeft === 0 ? 'Due today' : `${Math.abs(daysLeft)}d overdue`
      : 'No deadline';

  return (
    <div className={`goal-row ${goal.completed ? 'goal-done' : ''}`}>
      <div className="goal-row-info">
        <div className="goal-row-name">{goal.name}</div>
        <div className={`goal-row-meta ${daysLeft !== null && daysLeft <= 7 && !goal.completed ? 'urgent' : ''}`}>
          {metaText}
        </div>
      </div>
      <div className="goal-row-progress">
        <div className="goal-row-bar-label">
          <span>Progress</span>
          <span className={goal.completed ? 'goal-pct-done' : ''}>{goal.completed ? 'Done' : `${progress}%`}</span>
        </div>
        <div className="progress-bar" style={{ height: 3 }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%`, background: goal.completed ? 'var(--success)' : 'var(--accent)' }} />
        </div>
        {!goal.completed && (
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={e => setProgress(Number(e.target.value))}
            onMouseUp={e => onUpdate(goal.id, { progress: Number(e.target.value), completed: Number(e.target.value) >= 100 })}
            onTouchEnd={e => onUpdate(goal.id, { progress: Number(e.target.value), completed: Number(e.target.value) >= 100 })}
            className="progress-slider"
          />
        )}
      </div>
      <div className="goal-row-actions">
        <button className="row-btn row-btn-delete" onClick={() => onDelete(goal.id)}>Del</button>
      </div>
    </div>
  );
}
