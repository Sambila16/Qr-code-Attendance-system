import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  home: (
    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  ),
  sessions: (
    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v4H4zM4 12h16M4 12v8h16v-8M4 12l4-4m8 4-4-4" />
  ),
  review: (
    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 4h6l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4z M9 12h6M9 16h6M9 8h2" />
  ),
  students: (
    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20m14-9a4 4 0 1 0 0-8m2 17v-1.5a4 4 0 0 0-3-3.87M9.5 10.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
  ),
  scan: (
    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 8V5a1 1 0 0 1 1-1h3M4 16v3a1 1 0 0 0 1 1h3m9-16h3a1 1 0 0 1 1 1v3m-4 12h3a1 1 0 0 0 1-1v-3M9 9h6v6H9z" />
  ),
  history: (
    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2" />
  ),
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
      {icons[name]}
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const isCr = user?.role === 'cr' || user?.role === 'admin';

  const crLinks = [
    { to: '/cr', label: 'Overview', icon: 'home', end: true },
    { to: '/cr/sessions', label: 'Sessions', icon: 'sessions' },
    { to: '/cr/students', label: 'Students', icon: 'students' },
    { to: '/cr/review', label: 'Review & Export', icon: 'review' },
  ];
  const studentLinks = [
    { to: '/student', label: 'Home', icon: 'home', end: true },
    { to: '/student/scan', label: 'Scan Attendance', icon: 'scan' },
    { to: '/student/history', label: 'My History', icon: 'history' },
  ];

  const links = isCr ? crLinks : studentLinks;

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col bg-panel border-r border-white/5 px-5 py-6">
      <div className="flex items-center gap-2.5 px-1 mb-10">
        <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z" />
          </svg>
        </div>
        <div>
          <p className="font-display font-semibold leading-tight">Presence</p>
          <p className="text-[11px] text-mist">Attendance, verified</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? 'bg-accent/15 text-accent' : 'text-mist hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon name={l.icon} />
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 pt-4 mt-4">
        <p className="text-sm font-medium truncate">{user?.full_name}</p>
        <p className="text-xs text-mist truncate">{user?.registration_number}</p>
        <button onClick={logout} className="mt-3 text-xs text-danger hover:underline">
          Sign out
        </button>
      </div>
    </aside>
  );
}
