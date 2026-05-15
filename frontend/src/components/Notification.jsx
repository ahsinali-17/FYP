import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Clock, Trash2, Smartphone, ShieldCheck, Info, FolderCheck, User2 } from 'lucide-react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

const Notification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Fetch directly from the Database
  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
          setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    window.addEventListener('refresh_notifications', fetchNotifications);
    
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
        window.removeEventListener('refresh_notifications', fetchNotifications);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAsRead = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    const ids = notifications.map(n => n.id);
    setNotifications([]);
    if (ids.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).in('id', ids);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'batch': return <FolderCheck size={16} className="text-violet-500" />;
      case 'scan': return <Smartphone size={16} className="text-sky-500" />;
      case 'delete': return <Trash2 size={16} className="text-red-500" />;
      case 'security': return <ShieldCheck size={16} className="text-emerald-600" />;
       case 'profile': return <User2 size={16} className="text-yellow-500" />;
      default: return <Info size={16} className="text-slate-500" />;
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'batch': return 'bg-violet-500 text-violet-500';
      case 'scan': return 'bg-sky-500 text-sky-500';
      case 'delete': return 'bg-red-500 text-red-500';
      case 'security': return 'bg-emerald-500 text-emerald-500';
      case 'profile': return 'bg-yellow-500 text-yellow-500';
      default: return 'bg-slate-500 text-slate-500';
    }
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="sm:p-2 text-slate-500 hover:text-violet-700 hover:bg-violet-100 rounded-full transition-colors relative cursor-pointer"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
            {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-xs text-slate-500 hover:text-violet-700 font-medium cursor-pointer transition-colors">
                  Mark all read
                </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-slate-400 text-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <BellOff size={24} className="text-slate-300" />
                </div>
                <p className="font-medium text-slate-500">No new alerts</p>
                <p className="text-xs mt-1 text-center">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex gap-3 items-start">
                    <div className="mt-0.5 p-1.5 rounded-full bg-white border border-slate-100 shadow-sm shrink-0">
                      {getIconForType(notif.type)}
                    </div>
                    
                    <div className="flex-1 cursor-pointer" onClick={() => {
                        markAsRead(notif.id);
                    }}>
                      <p className="text-sm font-semibold text-slate-800">{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={10} /> {timeAgo(notif.created_at)}
                      </p>
                    </div>
                    
                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); 
                            markAsRead(notif.id);
                        }}
                        className={`w-2 h-2 ${getColorForType(notif.type)} rounded-full mt-2 hover:scale-150 transition-transform cursor-pointer shrink-0`}
                        title="Mark as read"
                    ></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;


