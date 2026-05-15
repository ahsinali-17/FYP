import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ProfileMenu from './ProfileMenu';
import Notification from './Notification';
import HelpMenu from './HelpMenu';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  ChevronRight, Bell, HelpCircle, Menu 
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getPageConfig = (pathname) => {
    switch (pathname) {
      case '/': return { title: 'Dashboard', subtitle: 'Shop Overview & Statistics' };
      case '/inspection': return { title: 'New Inspection', subtitle: 'AI-Powered Defect Detection'};
      case '/history': return { title: 'Inspection History', subtitle: 'Archive of all past device scans' };
      case '/settings': return { title: 'Settings', subtitle: 'Personal & AI Settings' };
      case '/contact-support': return { title: 'Contact Support', subtitle: 'Get help with any issues or questions' };
      case '/faq': return { title: 'FAQ', subtitle: 'Frequently Asked Questions' };
      default: return { title: 'QA System', subtitle: 'Quality Assurance Control' };
    }
  };

  const currentConfig = getPageConfig(location.pathname);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        draggable
        pauseOnHover
        theme="dark"
      />

      <Sidebar isOpen={isSidebarOpen} toggleSidebar={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full h-screen overflow-y-auto relative transition-all duration-300">
        
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between transition-all">
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1">
              {/* Hamburger Button (Mobile Only) */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden text-slate-600 hover:text-violet-700 mr-1 cursor-pointer"
              >
                <Menu size={20} />
              </button>

              <span>Application</span>
              <ChevronRight size={12} />
              <span className="text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full capitalize truncate max-w-25 md:max-w-none">
                {currentConfig.title}
              </span>
            </div>
            
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              {currentConfig.title}
            </h1>
            <p className="text-sm text-slate-600 hidden md:block">
              {currentConfig.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Notification/>
            <HelpMenu/>
            <ProfileMenu />
          </div>
        </header>

        <main className="flex-1 p-4 md:px-8">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;


