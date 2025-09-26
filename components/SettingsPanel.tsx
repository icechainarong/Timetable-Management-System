import React, { useState, useEffect } from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { TimetableSettings, Translator } from '../types';

interface SettingsPanelProps {
  timetableState: UseTimetableReturn;
  t: Translator;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ timetableState, t }) => {
  const [settings, setSettings] = useState<TimetableSettings>(timetableState.settings);

  useEffect(() => {
    setSettings(timetableState.settings);
  }, [timetableState.settings]);

  const handleSave = () => {
    timetableState.setSettings(settings);
    alert(t('settingsSaved'));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10) || 0;

    setSettings(prev => {
        const newSettings = { ...prev, [name]: numValue };

        if (name === 'periodsPerDay') {
            const newLength = Math.max(0, numValue);
            // FIX: Ensure currentTimes is always an array to prevent crash if it's missing in `prev` state.
            const currentTimes = Array.isArray(prev.periodTimes) ? prev.periodTimes : [];
            const newTimes = Array.from({ length: newLength }, (_, i) => currentTimes[i] || '');
            newSettings.periodTimes = newTimes;
        }

        return newSettings;
    });
  };

  const handlePeriodTimeChange = (index: number, value: string) => {
    // FIX: Ensure settings.periodTimes is an array before spreading to prevent crashes.
    const newPeriodTimes = [...(settings.periodTimes || [])];
    newPeriodTimes[index] = value;
    setSettings(prev => ({ ...prev, periodTimes: newPeriodTimes }));
  };


  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('timeSlotSettings')}</h2>
      <div className="space-y-6">
        
        {/* Timetable Structure */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">{t('timetable')}</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="daysPerWeek" className="block text-sm font-medium text-gray-700">{t('daysPerWeek')}</label>
              <input
                type="number"
                id="daysPerWeek"
                name="daysPerWeek"
                value={settings.daysPerWeek || 0}
                onChange={handleInputChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="periodsPerDay" className="block text-sm font-medium text-gray-700">{t('periodsPerDay')}</label>
              <input
                type="number"
                id="periodsPerDay"
                name="periodsPerDay"
                value={settings.periodsPerDay || 0}
                onChange={handleInputChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">{t('periodTimes')}</h4>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: settings.periodsPerDay || 0 }).map((_, index) => (
                  <div key={index}>
                    <label className="block text-xs text-gray-600">{t('period')} {index + 1}</label>
                    <input
                      type="text"
                      value={(settings.periodTimes && settings.periodTimes[index]) || ''}
                      onChange={(e) => handlePeriodTimeChange(index, e.target.value)}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                      placeholder="e.g. 08:00 - 08:45"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Workload Calculation Settings */}
        <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{t('teacherWorkload')}</h3>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="minutesPerPeriod" className="block text-sm font-medium text-gray-700">{t('minutesPerPeriod')}</label>
                    <input type="number" id="minutesPerPeriod" name="minutesPerPeriod" value={settings.minutesPerPeriod || 0} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                 <div>
                    <label htmlFor="standardWeeklyHours" className="block text-sm font-medium text-gray-700">{t('standardWeeklyHours')}</label>
                    <input type="number" id="standardWeeklyHours" name="standardWeeklyHours" value={settings.standardWeeklyHours || 0} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t('workloadThresholds')}</label>
                    <p className="text-xs text-gray-500 mb-2">{t('workloadThresholdsDesc')}</p>
                    <div className="flex items-center gap-4">
                        <input type="number" id="workloadMinHours" name="workloadMinHours" value={settings.workloadMinHours || 0} onChange={handleInputChange} className="block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="Min" />
                        <span>-</span>
                        <input type="number" id="workloadMaxHours" name="workloadMaxHours" value={settings.workloadMaxHours || 0} onChange={handleInputChange} className="block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="Max" />
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button onClick={handleSave} className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
            {t('saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
};