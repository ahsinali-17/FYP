import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, BookOpen, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="sm:p-2 text-slate-500 hover:text-violet-700 hover:bg-violet-100 rounded-full transition-colors cursor-pointer"
      >
        <HelpCircle size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            <button 
              onClick={() => handleNavigate('/faq')}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-violet-100 hover:text-violet-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <BookOpen size={16} /> FAQ & Guide
            </button>
            <button 
              onClick={() => handleNavigate('/contact-support')}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-violet-100 hover:text-violet-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer mt-1"
            >
              <MessageCircle size={16} /> Contact Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpMenu;


