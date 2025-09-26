import React, { useState } from 'react';
import type { ActiveView, Translator } from '../types';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { Language } from '../i18n';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  timetableState: UseTimetableReturn;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translator;
}

const navStructure = [
    { title: 'Global Settings', titleKey: 'globalSettings', icon: 'public', children: [
        { item: 'Institution', key: 'institution' }, 
        { item: 'Academic Calendar', key: 'academicCalendar' }, 
        { item: 'Time Slots', key: 'timeSlots' }
    ]},
    { title: 'Master Data', titleKey: 'masterData', icon: 'database', children: [
        { item: 'Teachers', key: 'teachers' }, 
        { item: 'Classes', key: 'classes' }, 
        { item: 'Subjects', key: 'subjects' }, 
        { item: 'Rooms', key: 'rooms' },
        { item: 'Events / Activities', key: 'events' },
    ]},
    { title: 'Timetable', titleKey: 'timetable', icon: 'calendar_month', children: [
        { item: 'Manual Editor', key: 'manualEditor' }, 
        { item: 'AI Scheduler', key: 'aiScheduler' }, 
        { item: 'Conflicts', key: 'conflicts' }
    ]},
    { title: 'Exams', titleKey: 'exams', icon: 'school', children: [
        { item: 'Exam Periods', key: 'examPeriods' }, 
        { item: 'Subject Assignments', key: 'subjectAssignments' }, 
        { item: 'Room Allocation', key: 'roomAllocation' }, 
        { item: 'Invigilator Assignment', key: 'invigilatorAssignment' }
    ]},
    { title: 'Reports', titleKey: 'reports', icon: 'summarize', children: [
        { item: 'Student Timetable', key: 'studentTimetableA' }, 
        { item: 'Teacher Timetable', key: 'teacherTimetableB' }, 
        { item: 'Exam Timetable', key: 'examTimetable' }, 
        { item: 'Export / Print', key: 'exportPrint' },
        { item: 'Print Setting', key: 'printSettings' },
    ]},
    { title: 'Analytics', titleKey: 'analytics', icon: 'analytics', children: [
        { item: 'Dashboard', key: 'dashboard' }, 
        { item: 'Teacher Workload', key: 'teacherWorkload' }, 
        { item: 'Conflict Reports', key: 'conflictReports' }
    ]},
    { title: 'Advanced', titleKey: 'advanced', icon: 'settings_power', children: [
        { item: 'Calendar Integration', key: 'calendarIntegration' }, 
        { item: 'Import/Export', key: 'importExport' },
        { item: 'Save / Load Data', key: 'saveLoadData' },
    ]},
    { title: 'Administration', titleKey: 'administration', icon: 'admin_panel_settings', children: [
        { item: 'System Settings', key: 'systemSettings' }
    ]},
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, timetableState, language, setLanguage, t }) => {
    const [expandedGroup, setExpandedGroup] = useState<string | null>(activeView.group);
    
    const handleGroupClick = (groupTitle: string) => {
        setExpandedGroup(prev => (prev === groupTitle ? null : groupTitle));
    }

  return (
    <aside className="w-72 bg-gray-800 text-gray-200 flex flex-col no-print">
      <div className="p-4 border-b border-gray-700 flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl text-blue-400">grid_view</span>
        <h2 className="text-xl font-bold">{t('appTitle')}</h2>
      </div>
      <nav className="flex-grow p-2 overflow-y-auto">
        <ul className="space-y-1">
            {navStructure.map(group => (
                <li key={group.title}>
                    <button onClick={() => handleGroupClick(group.title)} className="w-full flex justify-between items-center text-left p-3 rounded-md hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-lg">{group.icon}</span>
                            <span className="font-semibold">{t(group.titleKey as any)}</span>
                        </div>
                        <span className={`material-symbols-outlined transition-transform ${expandedGroup === group.title ? 'rotate-180' : 'rotate-0'}`}>
                            expand_more
                        </span>
                    </button>
                    {expandedGroup === group.title && (
                        <ul className="pl-8 pt-1 pb-2 border-l border-gray-700 ml-5">
                            {group.children.map(child => (
                                <li key={child.item}>
                                    <button onClick={() => setActiveView({group: group.title, item: child.item})} className={`w-full text-left p-2 rounded-md text-sm transition-colors ${activeView.item === child.item && activeView.group === group.title ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                                        {t(child.key as any)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <label htmlFor="language-select" className="block text-sm font-medium text-gray-400 mb-2">{t('language')}</label>
        <select 
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            <option value="en">English</option>
            <option value="th">ภาษาไทย</option>
        </select>
      </div>
    </aside>
  );
};