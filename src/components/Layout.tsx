import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { avatarFor } from '../lib/utils';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
  </svg>
);
const CompassIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><polygon points="16 8 13 13 8 16 11 11 16 8" />
  </svg>
);
const ReelsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="3" /><polygon points="10 9 15 12 10 15 10 9" fill="currentColor" />
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const items = [
    { to: '/', label: 'Home', icon: HomeIcon, end: true },
    { to: '/explore', label: 'Explore', icon: CompassIcon, end: false },
    { to: '/reels', label: 'Reels', icon: ReelsIcon, end: false },
    { to: profile ? `/u/${profile.username}` : '/', label: 'Profile', icon: UserIcon, end: false },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app">
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="logo">S</div>
            <div className="name">social<span>hub</span></div>
          </div>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <it.icon />
              <span>{it.label}</span>
            </NavLink>
          ))}
          <div className="sidebar-spacer" />
          {profile && (
            <NavLink to={`/u/${profile.username}`} className="user-card" style={{ textDecoration: 'none' }}>
              <img src={avatarFor(profile)} alt={profile.display_name} />
              <div className="meta">
                <span className="n">{profile.display_name}</span>
                <span className="u">@{profile.username}</span>
              </div>
            </NavLink>
          )}
          <button className="nav-item" onClick={handleSignOut}>
            <LogoutIcon />
            <span>Sign out</span>
          </button>
        </aside>

        <main className="main">{children}</main>
      </div>

      <nav className="mobile-nav">
        <div className="inner">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <it.icon />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
