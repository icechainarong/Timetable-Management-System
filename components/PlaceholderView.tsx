
import React from 'react';
import type { Translator } from '../types';

interface PlaceholderViewProps {
  title: string;
  description?: string;
  t: Translator;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, description, t }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-white p-8 rounded-lg shadow-lg border-2 border-dashed border-gray-300">
      <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
        engineering
      </span>
      <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
      <p className="text-gray-500 mt-2 max-w-md">
        {description || t('underConstruction')}
      </p>
    </div>
  );
};
