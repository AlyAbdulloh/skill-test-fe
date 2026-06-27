import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export const MainLayout: React.FC = () => {
  // Use React state to control the drawer. This allows us to programmatically close
  // the drawer (e.g. when menu items are clicked on mobile viewports).
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = 'app-sidebar-drawer';

  const handleDrawerToggle = (open: boolean) => {
    setDrawerOpen(open);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input
        id={drawerId}
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        onChange={(e) => handleDrawerToggle(e.target.checked)}
      />

      {/* Main Content Area */}
      <div className="drawer-content flex flex-col min-h-screen bg-base-100">
        <Navbar drawerId={drawerId} />

        {/* Dynamic content page container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-base-200/50">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>

      {/* Sidebar Drawer Side panel */}
      <div className="drawer-side z-40">
        <label
          htmlFor={drawerId}
          aria-label="close sidebar"
          className="drawer-overlay"
          onClick={closeDrawer}
        ></label>
        <Sidebar onClose={closeDrawer} />
      </div>
    </div>
  );
};

export default MainLayout;
