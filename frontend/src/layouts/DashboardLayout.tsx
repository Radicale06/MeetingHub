import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Video, Users, Settings, Search, LogOut, Moon, Sun, User } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './DashboardLayout.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/meetings', label: 'Meetings', icon: Calendar },
  { path: '/recordings', label: 'Recordings & Reports', icon: Video },
  { path: '/contacts', label: 'Team Contacts', icon: Users },
];

export const DashboardLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/login');
  };

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || user.email[0].toUpperCase()
    : '?';

  return (
    <div className="mh-dashboard-layout">
      {/* Sidebar */}
      <aside className="mh-sidebar">
        <div className="mh-sidebar-logo">
          <div className="mh-logo-icon">
            <Video size={18} color="white" />
          </div>
          <h1>MeetingHub</h1>
        </div>

        <nav className="mh-sidebar-nav">
          <div className="mh-nav-main">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `mh-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon size={20} className="mh-nav-icon" />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="mh-nav-bottom">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `mh-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Settings size={20} className="mh-nav-icon" />
              Settings
            </NavLink>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="mh-main-wrapper">
        <header className="mh-topbar">
          <div className="mh-search-container">
            <Search size={18} className="mh-search-icon" />
            <input
              type="text"
              placeholder="Search meetings, recordings..."
              className="mh-search-input"
            />
          </div>

          <div className="mh-topbar-right" ref={dropdownRef}>
            <button
              className="mh-topbar-profile"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <Avatar
                fallback={initials}
                src={user?.avatarUrl || undefined}
                size="sm"
              />
            </button>

            {dropdownOpen && (
              <div className="mh-profile-dropdown">
                <div className="mh-dropdown-user">
                  <Avatar
                    fallback={initials}
                    src={user?.avatarUrl || undefined}
                    size="md"
                  />
                  <div className="mh-dropdown-user-info">
                    <span className="mh-dropdown-name">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || 'User'}
                    </span>
                    <span className="mh-dropdown-email">{user?.email}</span>
                  </div>
                </div>

                <div className="mh-dropdown-divider" />

                <button
                  className="mh-dropdown-item"
                  onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                >
                  <User size={16} />
                  Profile & Settings
                </button>

                <button className="mh-dropdown-item" onClick={toggleTheme}>
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>

                <div className="mh-dropdown-divider" />

                <button className="mh-dropdown-item mh-dropdown-danger" onClick={handleSignOut}>
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mh-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
