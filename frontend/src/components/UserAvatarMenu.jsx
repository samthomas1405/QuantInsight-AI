// src/components/UserAvatarMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      <button
        onClick={toggleMenu}
        className="w-10 h-10 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center hover:bg-cyan-500 focus:outline-none"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-800">{firstName} {lastName}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => alert('Profile option (not implemented)')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatarMenu;
