import React, { useState, useEffect } from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { PrintSettings, Translator } from '../types';
import { AVAILABLE_FONTS } from '../constants';

interface PrintSettingsViewProps {
  timetableState: UseTimetableReturn;
  t: Translator;
}

export const PrintSettingsView: React.FC<PrintSettingsViewProps> = ({ timetableState, t }) => {
  const [settings, setSettings] = useState<PrintSettings>(timetableState.printSettings);

  useEffect(() => {
    setSettings(timetableState.printSettings);
  }, [timetableState.printSettings]);

  const handleSave = () => {
    timetableState.setPrintSettings(settings);
    alert(t('settingsSaved'));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    setSettings(prev => ({ 
        ...prev, 
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('printSettingsTitle')}</h2>
      <div className="space-y-6">
        
        {/* Paper and Orientation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="paperSize" className="block text-sm font-medium text-gray-700">{t('paperSize')}</label>
            <select
              id="paperSize"
              name="paperSize"
              value={settings.paperSize}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
                <option value="A4">{t('a4')}</option>
                <option value="Letter">{t('letter')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="orientation" className="block text-sm font-medium text-gray-700">{t('orientation')}</label>
            <select
              id="orientation"
              name="orientation"
              value={settings.orientation}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
                <option value="portrait">{t('portrait')}</option>
                <option value="landscape">{t('landscape')}</option>
            </select>
          </div>
        </div>

        {/* Font Family and Color Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-700">{t('fontFamily')}</label>
                <select
                id="fontFamily"
                name="fontFamily"
                value={settings.fontFamily}
                onChange={handleInputChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                >
                    {AVAILABLE_FONTS.map(font => (
                        <option key={font.key} value={font.key}>{t(font.nameKey)}</option>
                    ))}
                </select>
            </div>
             <div>
                <label htmlFor="colorMode" className="block text-sm font-medium text-gray-700">{t('colorMode')}</label>
                <select
                id="colorMode"
                name="colorMode"
                value={settings.colorMode}
                onChange={handleInputChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                >
                    <option value="color">{t('color')}</option>
                    <option value="bw">{t('blackAndWhite')}</option>
                </select>
            </div>
        </div>

        {/* Margins */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">{t('margins')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
                <label htmlFor="marginTop" className="block text-xs text-gray-600">{t('top')}</label>
                <input
                  type="number"
                  id="marginTop"
                  name="marginTop"
                  value={settings.marginTop}
                  onChange={handleInputChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  step="0.1"
                />
            </div>
             <div>
                <label htmlFor="marginBottom" className="block text-xs text-gray-600">{t('bottom')}</label>
                <input
                  type="number"
                  id="marginBottom"
                  name="marginBottom"
                  value={settings.marginBottom}
                  onChange={handleInputChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  step="0.1"
                />
            </div>
             <div>
                <label htmlFor="marginLeft" className="block text-xs text-gray-600">{t('left')}</label>
                <input
                  type="number"
                  id="marginLeft"
                  name="marginLeft"
                  value={settings.marginLeft}
                  onChange={handleInputChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  step="0.1"
                />
            </div>
             <div>
                <label htmlFor="marginRight" className="block text-xs text-gray-600">{t('right')}</label>
                <input
                  type="number"
                  id="marginRight"
                  name="marginRight"
                  value={settings.marginRight}
                  onChange={handleInputChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  step="0.1"
                />
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div>
            <label className="flex items-center">
                <input
                    type="checkbox"
                    name="showLogo"
                    checked={settings.showLogo}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{t('showInstitutionLogo')}</span>
            </label>
        </div>


        <div className="pt-4 flex justify-end">
          <button onClick={handleSave} className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2">
            <span className="material-symbols-outlined">save</span>
            {t('saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
};