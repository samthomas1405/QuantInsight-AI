// src/components/UserAvatarMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

const UserAvatarMenu = ({ firstName, lastName, email }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  const initials = firstName && lastName
  ? `${firstName[0]}${lastName[0]}`.toUpperCase()
  : 'U';

  const toggleMenu = () => setOpen(prev => !prev);
  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleMenu}
        className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold flex items-center justify-center hover:from-blue-600 hover:to-indigo-600 focus:outline-none shadow-lg hover:shadow-xl transition-all duration-300 group"
      >
        <span className="text-sm font-semibold">{initials}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md"
        >
          <ChevronDown className="w-3 h-3 text-blue-600" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
          >
            {/* User Info */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {firstName} {lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{email}</p>
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <div className="py-2">
              <motion.button
                whileHover={{ backgroundColor: 'rgb(241 245 249)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  alert('Profile option (not implemented)');
                  closeMenu();
                }}
                className="w-full flex items-center px-6 py-3 text-sm text-slate-700 hover:text-slate-900 transition-colors duration-200"
              >
                <Settings className="w-4 h-4 mr-3" />
                Profile Settings
              </motion.button>
              
              <motion.button
                whileHover={{ backgroundColor: 'rgb(254 242 242)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleLogout();
                  closeMenu();
                }}
                className="w-full flex items-center px-6 py-3 text-sm text-red-600 hover:text-red-700 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserAvatarMenu;
