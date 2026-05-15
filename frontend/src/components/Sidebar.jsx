import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { toast } from 'react-toastify';
import { 
  LayoutDashboard, 
  ScanLine, 
  History, 
  LogOut, 
  Settings,
  X 
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");
    
    await supabase.auth.signOut();
    
    toast.update(toastId, { render: "Logged out", type: "success", isLoading: false, autoClose: 1000 });
    navigate('/login');
  };
    
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ScanLine, label: 'New Inspection', path: '/inspection' },
    { icon: History, label: 'History', path: '/history' },
  ];

  return (
    <>
      {/* Mobile Overlay*/}
      {isOpen && (
        <div 
          className="cursor-pointer fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => toggleSidebar(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-3/4 lg:w-64 bg-slate-900 text-slate-300 flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static
      `}>
        
        {/* Logo Area */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <img src="/logo.webp" alt="Logo" className="w-10 h-10 rounded-full border-2 border-violet-700 object-contain" />
            <span>ScreenSense AI</span>
          </h2>

          {/* Close Button */}
          <button 
            onClick={() => toggleSidebar(false)}
            className="md:hidden text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => toggleSidebar(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-violet-700 text-white shadow-lg shadow-violet-500/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <NavLink 
            to="/settings" 
            onClick={() => toggleSidebar(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full hover:bg-slate-800 hover:text-white transition-all text-left cursor-pointer"
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </NavLink>

          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-left cursor-pointer"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;


