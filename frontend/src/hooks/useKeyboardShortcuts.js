import { useEffect, useCallback } from 'react';

const useKeyboardShortcuts = (shortcuts) => {
  const handleKeyPress = useCallback((event) => {
    // Get the key combination
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey; // metaKey for Mac
    const shift = event.shiftKey;
    const alt = event.altKey;

    // Don't trigger shortcuts when typing in input fields
    const isTyping = ['input', 'textarea', 'select'].includes(
      event.target.tagName.toLowerCase()
    );

    shortcuts.forEach((shortcut) => {
      const matchesKey = shortcut.key.toLowerCase() === key;
      const matchesCtrl = shortcut.ctrl ? ctrl : !ctrl;
      const matchesShift = shortcut.shift ? shift : !shift;
      const matchesAlt = shortcut.alt ? alt : !alt;
      const shouldPreventWhenTyping = shortcut.preventDefault !== false;

      if (
        matchesKey &&
        matchesCtrl &&
        matchesShift &&
        matchesAlt &&
        (!isTyping || !shouldPreventWhenTyping)
      ) {
        event.preventDefault();
        shortcut.handler(event);
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
};

// Common keyboard shortcuts for the app
export const commonShortcuts = [
  {
    key: 'k',
    ctrl: true,
    description: 'Open search',
    category: 'Navigation'
  },
  {
    key: '/',
    description: 'Focus search',
    category: 'Navigation',
    preventDefault: false
  },
  {
    key: 'g',
    ctrl: true,
    description: 'Go to dashboard',
    category: 'Navigation'
  },
  {
    key: 'a',
    ctrl: true,
    description: 'Add new stock',
    category: 'Actions'
  },
  {
    key: 'p',
    ctrl: true,
    description: 'Open predictor',
    category: 'Actions'
  },
  {
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts',
    category: 'Help'
  },
  {
    key: 'Escape',
    description: 'Close modals/Cancel',
    category: 'General'
  }
];

export default useKeyboardShortcuts;