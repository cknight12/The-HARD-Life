import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-logo">The HARD Life</div>
        <div className="landing-nav-links">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-label">Habit &amp; Goal Tracking</div>
        <h1 className="hero-title">
          Build the discipline<br />to become who<br />you intend to be.
        </h1>
        <p className="hero-tagline">
          Growth happens best in the context of community.
        </p>
        <p className="hero-sub">
          Track daily habits, set goals with deadlines, and share your progress with the people who hold you accountable. No gamification. No noise. Just the work.
        </p>
        <div className="hero-cta">
          <Link to="/signup" className="btn btn-primary btn-lg">Start tracking</Link>
          <Link to="/login" className="btn btn-ghost btn-lg">Sign in</Link>
        </div>
      </section>

      <div className="stats-row">
        <div className="stat-block">
          <div className="stat-value">21</div>
          <div className="stat-label">Days to form a habit</div>
        </div>
        <div className="stat-block">
          <div className="stat-value">66%</div>
          <div className="stat-label">Higher success rate with accountability</div>
        </div>
        <div className="stat-block">
          <div className="stat-value">1%</div>
          <div className="stat-label">Better every day compounds to 37x in a year</div>
        </div>
      </div>

      <div className="features">
        <div className="feature-block">
          <div className="feature-number">01</div>
          <h3>Daily Habit Tracking</h3>
          <p>Mark habits complete each day. Consecutive completions build streaks. Miss a day and the streak resets — no exceptions.</p>
        </div>
        <div className="feature-block">
          <div className="feature-number">02</div>
          <h3>Goal Milestones</h3>
          <p>Define goals with target dates and track progress from 0 to 100%. Deadline pressure creates urgency.</p>
        </div>
        <div className="feature-block">
          <div className="feature-number">03</div>
          <h3>Shared Progress</h3>
          <p>Connect with friends and see each other's streaks in real time. Accountability is the multiplier.</p>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="landing-footer-text">The HARD Life</div>
        <div className="landing-footer-text">Consistency is the only strategy.</div>
      </footer>
    </div>
  );
}
