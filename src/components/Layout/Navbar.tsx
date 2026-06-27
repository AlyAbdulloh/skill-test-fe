import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  drawerId: string;
}

export const Navbar: React.FC<NavbarProps> = ({ drawerId }) => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <header className="navbar bg-base-100 border-b border-base-200 px-4 sticky top-0 z-30">
      {/* Navbar Left: Toggle & Logo */}
      <div className="flex-none lg:hidden">
        <label
          htmlFor={drawerId}
          aria-label="open sidebar"
          className="btn btn-square btn-square btn-ghost drawer-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block h-5 w-5 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </label>
      </div>

      <div className="flex-1 px-2 mx-2">
        {/* <span className="text-lg font-bold tracking-wider text-primary">SkillTest Portal</span> */}
      </div>

      {/* Navbar Center: Optional Search bar for Desktop */}
      {/* <div className="flex-none hidden md:block mr-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="input input-sm input-bordered pl-8 w-64 focus:outline-primary"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="absolute left-2.5 top-2.5 h-4 w-4 opacity-70 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div> */}

      {/* Navbar Right: Notifications & User profile */}
      <div className="flex-none gap-2">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="btn btn-ghost btn-circle"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-base-content">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-amber-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.95 4.95l1.59 1.59m10.92 10.92l1.59 1.59M3 12h2.25m13.5 0H21m-16.05 6.05l1.59-1.59m10.92-10.92l1.59-1.59M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
            </svg>
          )}
        </button>

        {/* Notification Bell */}
        {/* <div className="dropdown dropdown-end">
          <button tabIndex={0} role="button" className="btn btn-ghost btn-circle">
            <div className="indicator">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-5 w-5 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="badge badge-xs badge-primary indicator-item"></span>
            </div>
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow border border-base-200 mt-3"
          >
            <li className="menu-title px-4 py-2 font-bold">Notifications</li>
            <li><a className="text-sm">New assignment uploaded</a></li>
            <li><a className="text-sm">System update completed</a></li>
          </ul>
        </div> */}

        {/* User profile dropdown */}
        <div className="dropdown dropdown-end">
          <button tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full border-2 border-primary/20">
              <img
                alt="User Profile"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
              />
            </div>
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow border border-base-200 mt-3"
          >
            <li className="px-4 py-2 border-b border-base-200 mb-1">
              <div className="font-semibold block text-base-content text-left p-0">{user?.name || 'User Profile'}</div>
              <div className="text-xs text-base-content/60 text-left p-0">{user?.email || 'No email'}</div>
            </li>
            {/* <li><a className="py-2">My Profile</a></li>
            <li><a className="py-2">Settings</a></li> */}
            <li className="mt-1 border-t border-base-200 pt-1">
              <button onClick={logout} className="text-error font-medium py-2 text-left w-full block">
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
