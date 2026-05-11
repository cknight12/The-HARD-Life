import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './Layout.css';

function DashIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" />
      <circle cx="12" cy="5" r="2" />
      <path d="M15 13c0-1.66-.9-3.1-2.25-3.87" />
    </svg>
  );
}

function GroupsIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="4" cy="5" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="8" cy="5" r="2" />
      <path d="M1 13c0-1.66 1.34-3 3-3M15 13c0-1.66-1.34-3-3-3M5 13c0-1.66 1.34-3 3-3s3 1.34 3 3" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-wordmark">The HARD Life</div>
          <div className="logo-tagline">Habit &amp; goal tracking</div>
        </div>

        <div className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <DashIcon />Dashboard
          </NavLink>
          <NavLink to="/friends" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FriendsIcon />Friends
          </NavLink>
          <NavLink to="/groups" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <GroupsIcon />Groups
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <SettingsIcon />Settings
          </NavLink>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <Avatar name={user?.name} avatarUrl={user?.avatarUrl} size={30} radius={4} />
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              {user?.motto
                ? <div className="user-motto">{user.motto}</div>
                : <div className="user-email">{user?.email}</div>
              }
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 2H2v8h3M8 4l2 2-2 2M10 6H5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
