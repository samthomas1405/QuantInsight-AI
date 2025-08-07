// src/components/UserAvatarMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const UserAvatarMenu = ({ firstName, lastName, email }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();
  const { isDark } = useTheme();

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
        className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center focus:outline-none shadow-lg hover:shadow-xl transition-all duration-300 group"
      >
        <span className="text-sm font-semibold">{initials}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-md border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <ChevronDown className={`w-3 h-3 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl border z-50 overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            {/* Professional User Info */}
            <div className={`px-6 py-5 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-base font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {firstName} {lastName}
                  </p>
                  <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{email}</p>
                </div>
              </div>
            </div>

            {/* Professional Menu Options */}
            <div className="py-2">
              <motion.button
                whileHover={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  alert('Profile option (not implemented)');
                  closeMenu();
                }}
                className={`w-full flex items-center px-6 py-3 text-sm transition-all duration-200 group ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <div className={`p-2 rounded-lg mr-3 transition-all ${isDark ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                  <Settings className="w-4 h-4" />
                </div>
                <span className="font-medium">Profile Settings</span>
              </motion.button>
              
              <motion.button
                whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleLogout();
                  closeMenu();
                }}
                className={`w-full flex items-center px-6 py-3 text-sm transition-all duration-200 group ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
              >
                <div className={`p-2 rounded-lg mr-3 transition-all ${isDark ? 'bg-red-900/30 group-hover:bg-red-900/50' : 'bg-red-100 group-hover:bg-red-200'}`}>
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-medium">Sign Out</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserAvatarMenu;
