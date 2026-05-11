import React from 'react';

export default function Avatar({ name = '', avatarUrl = '', size = 36, radius = 4 }) {
  const initial = name?.[0]?.toUpperCase() || '?';
  const style = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (avatarUrl) {
    return (
      <div style={style}>
        <img
          src={avatarUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
        />
        <div style={{ ...style, display: 'none', background: 'var(--accent-muted)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: size * 0.38 }}>
          {initial}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      ...style,
      background: 'var(--accent-muted)',
      border: '1px solid var(--accent-border)',
      color: 'var(--accent)',
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: size * 0.38,
    }}>
      {initial}
    </div>
  );
}
