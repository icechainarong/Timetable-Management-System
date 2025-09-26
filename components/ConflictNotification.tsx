
import React from 'react';
import type { Conflict, Translator } from '../types';

interface ConflictNotificationProps {
  conflicts: Conflict[];
  onDismiss: () => void;
  t: Translator;
}

export const ConflictNotification: React.FC<ConflictNotificationProps> = ({ conflicts, onDismiss, t }) => {
  if (conflicts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 w-full max-w-sm z-50">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg" role="alert">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold">{t('conflictDetected')}</p>
            <ul className="list-disc pl-5 mt-2 text-sm">
              {conflicts.map((conflict, index) => (
                <li key={index}>{conflict.message}</li>
              ))}
            </ul>
          </div>
          <button onClick={onDismiss} className="ml-4 text-red-500 hover:text-red-800">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
