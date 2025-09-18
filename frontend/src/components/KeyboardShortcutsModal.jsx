import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Command } from 'lucide-react';
import { commonShortcuts } from '../hooks/useKeyboardShortcuts';

const KeyboardShortcutsModal = ({ isOpen, onClose, isDark }) => {
  // Group shortcuts by category
  const shortcutsByCategory = commonShortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {});

  const getKeyDisplay = (shortcut) => {
    const keys = [];
    if (shortcut.ctrl) keys.push('⌘');
    if (shortcut.shift) keys.push('⇧');
    if (shortcut.alt) keys.push('⌥');
    keys.push(shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase());
    return keys;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* Header */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Command className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      Keyboard Shortcuts
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-gray-700 text-gray-400' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {shortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                            isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                          }`}
                        >
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {getKeyDisplay(shortcut).map((key, i) => (
                              <kbd
                                key={i}
                                className={`px-2 py-1 text-xs font-mono rounded border ${
                                  isDark
                                    ? 'bg-gray-700 border-gray-600 text-gray-300'
                                    : 'bg-white border-gray-300 text-gray-700'
                                }`}
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Footer */}
              <div className={`px-6 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Pro tip: Press <kbd className={`px-1.5 py-0.5 mx-1 text-xs rounded border ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                  }`}>?</kbd> anytime to show this help
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsModal;