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
        className="w-12 h-12 rounded-xl bg-[var(--gradient-primary)] text-white font-bold flex items-center justify-center focus:outline-none shadow-lg hover:shadow-xl transition-all duration-300 group glow-primary"
      >
        <span className="text-sm font-semibold">{initials}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute -bottom-1 -right-1 w-4 h-4 glass rounded-full flex items-center justify-center shadow-md border border-[var(--dark-border)]"
        >
          <ChevronDown className="w-3 h-3 text-[var(--primary-500)]" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-72 glass-dark rounded-2xl shadow-2xl border border-[var(--dark-border)] z-50 overflow-hidden"
          >
            {/* Professional User Info */}
            <div className="px-6 py-5 border-b border-[var(--dark-border)] glass">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--gradient-primary)] flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-[var(--text-primary)] truncate">
                    {firstName} {lastName}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] truncate">{email}</p>
                </div>
              </div>
            </div>

            {/* Professional Menu Options */}
            <div className="py-2">
              <motion.button
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  alert('Profile option (not implemented)');
                  closeMenu();
                }}
                className="w-full flex items-center px-6 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 group"
              >
                <div className="p-2 glass rounded-lg mr-3 group-hover:bg-white/10 transition-all">
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
                className="w-full flex items-center px-6 py-3 text-sm text-[var(--error)] hover:text-[var(--error)]/90 transition-all duration-200 group"
              >
                <div className="p-2 glass rounded-lg mr-3 group-hover:bg-[var(--error)]/10 transition-all">
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
