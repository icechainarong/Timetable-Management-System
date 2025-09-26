import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { AcademicCalendar as AcademicCalendarType, Holiday, Translator } from '../types';

interface AcademicCalendarProps {
  timetableState: UseTimetableReturn;
  t: Translator;
}

export const AcademicCalendar: React.FC<AcademicCalendarProps> = ({ timetableState, t }) => {
  const [calendar, setCalendar] = useState<AcademicCalendarType>(timetableState.academicCalendar);
  const [newHoliday, setNewHoliday] = useState({ date: '', description: '' });

  useEffect(() => {
    setCalendar(timetableState.academicCalendar);
  }, [timetableState.academicCalendar]);

  const handleSave = () => {
    timetableState.setAcademicCalendar(calendar);
    alert(t('calendarSaved'));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCalendar(prev => ({ ...prev, [name]: value }));
  };

  const handleNewHolidayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewHoliday(prev => ({...prev, [name]: value}));
  }

  const handleAddHoliday = () => {
      if (!newHoliday.date || !newHoliday.description) {
          alert(t('fillHolidayFields'));
          return;
      }
      const holidayToAdd: Holiday = { ...newHoliday, id: uuidv4() };
      setCalendar(prev => ({
          ...prev, 
          holidays: [...(prev.holidays || []), holidayToAdd]
      }));
      setNewHoliday({ date: '', description: '' });
  };
  
  const handleRemoveHoliday = (id: string) => {
      setCalendar(prev => ({
          ...prev,
          holidays: (prev.holidays || []).filter(h => h.id !== id)
      }));
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('academicCalendar')}</h2>
      <div className="space-y-6">
        {/* Academic Year Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6">
            <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">{t('academicYear')}</label>
                <input type="text" id="year" name="year" value={calendar.year || ''} onChange={handleInputChange} placeholder="e.g., 2024-2025" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700">{t('semester')}</label>
                <input type="text" id="semester" name="semester" value={calendar.semester || ''} onChange={handleInputChange} placeholder="e.g., 1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">{t('startDate')}</label>
                <input type="date" id="startDate" name="startDate" value={calendar.startDate || ''} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">{t('endDate')}</label>
                <input type="date" id="endDate" name="endDate" value={calendar.endDate || ''} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
        </div>

        {/* Holidays Management */}
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('holidaysEvents')}</h3>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                {(calendar.holidays || []).map(holiday => (
                    <div key={holiday.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border">
                        <div>
                            <p className="font-medium text-gray-900">{holiday.description}</p>
                            <p className="text-sm text-gray-500">{new Date(holiday.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                        </div>
                        <button onClick={() => handleRemoveHoliday(holiday.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                ))}
                 {(!calendar.holidays || calendar.holidays.length === 0) && <p className="text-gray-500 text-center py-4">{t('noHolidaysAdded')}</p>}
            </div>
            <div className="flex items-end gap-4 p-4 border-t bg-gray-50 rounded-b-lg">
                <div className="flex-grow">
                    <label htmlFor="newHolidayDescription" className="block text-sm font-medium text-gray-700">{t('description')}</label>
                    <input type="text" id="newHolidayDescription" name="description" value={newHoliday.description} onChange={handleNewHolidayChange} placeholder="e.g., Winter Break" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                 <div className="flex-grow">
                    <label htmlFor="newHolidayDate" className="block text-sm font-medium text-gray-700">{t('date')}</label>
                    <input type="date" id="newHolidayDate" name="date" value={newHoliday.date} onChange={handleNewHolidayChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <button onClick={handleAddHoliday} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center gap-2">
                   <span className="material-symbols-outlined">add</span> {t('addHoliday')}
                </button>
            </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button onClick={handleSave} className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2">
            <span className="material-symbols-outlined">save</span>
            {t('saveCalendar')}
          </button>
        </div>
      </div>
    </div>
  );
};