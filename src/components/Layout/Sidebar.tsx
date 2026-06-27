import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();

  // Check if current route is a sub-page of Master Data (only fee-types)
  const isMasterActive = location.pathname.startsWith('/fee-types');

  // Collapsible state for Master Data
  const [masterOpen, setMasterOpen] = useState(isMasterActive);

  // Auto-expand menu folder when nested route is active
  useEffect(() => {
    if (isMasterActive) {
      setMasterOpen(true);
    }
  }, [location.pathname, isMasterActive]);

  return (
    <aside className="w-80 min-h-full bg-base-200 border-r border-base-300 text-base-content flex flex-col justify-between">
      {/* Sidebar Header */}
      <div>
        <div className="h-16 flex items-center px-6 gap-3 border-b border-base-300 bg-base-100/50">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content w-8 rounded-lg font-black flex items-center justify-center">
              G
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight text-base-content">
            GriyaHub <span className="text-xs font-semibold text-primary">v1.0</span>
          </span>
        </div>

        {/* Menu Navigation */}
        <ul className="menu p-4 gap-1.5">
          {/* Dashboard */}
          <li>
            <NavLink
              to="/"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 px-4 rounded-xl transition-all font-medium ${isActive
                  ? 'bg-primary text-primary-content shadow-sm hover:bg-primary'
                  : 'hover:bg-base-300 text-base-content/85 hover:text-base-content'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-5 w-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </NavLink>
          </li>

          {/* Resident */}
          <li>
            <NavLink
              to="/residents"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 px-4 rounded-xl transition-all font-medium ${isActive
                  ? 'bg-primary text-primary-content shadow-sm hover:bg-primary'
                  : 'hover:bg-base-300 text-base-content/85 hover:text-base-content'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-5 w-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Resident</span>
            </NavLink>
          </li>

          {/* House */}
          <li>
            <NavLink
              to="/houses"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 px-4 rounded-xl transition-all font-medium ${isActive
                  ? 'bg-primary text-primary-content shadow-sm hover:bg-primary'
                  : 'hover:bg-base-300 text-base-content/85 hover:text-base-content'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-5 w-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>House</span>
            </NavLink>
          </li>

          {/* House Residents */}
          <li>
            <NavLink
              to="/house-residents"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 px-4 rounded-xl transition-all font-medium ${isActive
                  ? 'bg-primary text-primary-content shadow-sm hover:bg-primary'
                  : 'hover:bg-base-300 text-base-content/85 hover:text-base-content'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-5 w-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>House Residents</span>
            </NavLink>
          </li>

          {/* Master Data folder (Collapsible Submenu containing only Fee Types) */}

          {/* Payment Bill */}
          <li>
            <NavLink
              to="/payment-bills"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 px-4 rounded-xl transition-all font-medium ${isActive
                  ? 'bg-primary text-primary-content shadow-sm hover:bg-primary'
                  : 'hover:bg-base-300 text-base-content/85 hover:text-base-content'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-5 w-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Payment Bill</span>
            </NavLink>
          </li>

          {/* Expense */}
          <li>
            <NavLink
              to="/expenses"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 px-4 rounded-xl transition-all font-medium ${isActive
                  ? 'bg-primary text-primary-content shadow-sm hover:bg-primary'
                  : 'hover:bg-base-300 text-base-content/85 hover:text-base-content'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-5 w-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Expense</span>
            </NavLink>
          </li>

          <li>
            <details
              open={masterOpen}
              onToggle={(e) => setMasterOpen((e.target as HTMLDetailsElement).open)}
              className="group"
            >
              <summary className={`flex items-center gap-3 py-3 px-4 rounded-xl font-medium cursor-pointer transition-all hover:bg-base-300 text-base-content/85 ${isMasterActive ? 'text-primary font-bold bg-primary/5' : ''
                }`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125M3.75 10.125v3.75m16.5-3.75v3.75m-16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125M3.75 13.875v3.75" />
                </svg>
                <span className="flex-1">Master Data</span>
              </summary>
              <ul className="mt-1 pl-4 gap-1.5 border-l border-base-300 ml-6">
                <li>
                  <NavLink
                    to="/fee-types"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-2 py-2 px-3 rounded-lg transition-all text-sm font-medium ${isActive
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'hover:bg-base-300 text-base-content/80'
                      }`
                    }
                  >
                    Fee Types
                  </NavLink>
                </li>
              </ul>
            </details>
          </li>
        </ul>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-4 border-t border-base-300 bg-base-100/30 text-xs text-base-content/50 text-center">
        &copy; {new Date().getFullYear()} PT Beon Intermedia.
      </div>
    </aside>
  );
};

export default Sidebar;
