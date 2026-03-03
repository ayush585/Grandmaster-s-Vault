'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, type, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 px-5 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary text-[0.85rem] shadow-2xl z-[2000] transition-all duration-300
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0 pointer-events-none'}
        ${type === 'success' ? 'border-l-[3px] border-l-best' : 'border-l-[3px] border-l-blunder'}`}
    >
      {message}
    </div>
  );
}
