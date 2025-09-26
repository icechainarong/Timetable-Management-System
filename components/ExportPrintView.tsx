import React, { useState, useMemo } from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { Translator } from '../types';
import { TemplateA } from './TemplateA';
import { TemplateB } from './TemplateB';

interface ExportPrintViewProps {
  timetableState: UseTimetableReturn;
  t: Translator;
}

export const ExportPrintView: React.FC<ExportPrintViewProps> = ({ timetableState, t }) => {
    const { teachers, classGrades, departments } = timetableState;
    const [selectedReports, setSelectedReports] = useState<Record<string, boolean>>({});
    const [selectedGrade, setSelectedGrade] = useState<string>('all');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

    const uniqueGrades = useMemo(() => ['all', ...Array.from(new Set(classGrades.map(cg => cg.gradeLevel).filter(Boolean))).sort()], [classGrades]);
    const uniqueDepartments = useMemo(() => ['all', ...departments], [departments]);

    const filteredClassGrades = useMemo(() => classGrades.filter(cg => selectedGrade === 'all' || cg.gradeLevel === selectedGrade), [classGrades, selectedGrade]);
    const filteredTeachers = useMemo(() => teachers.filter(t => selectedDepartment === 'all' || t.department === selectedDepartment), [teachers, selectedDepartment]);

    const handleCheckboxChange = (id: string) => {
        setSelectedReports(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSelectVisible = (type: 'class' | 'teacher', select: boolean) => {
        const idsToChange = (type === 'class' ? filteredClassGrades : filteredTeachers).map(item => item.id);
        setSelectedReports(prev => {
            const newSelections = { ...prev };
            idsToChange.forEach(id => {
                newSelections[id] = select;
            });
            return newSelections;
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6 no-print">
                <h2 className="text-2xl font-bold text-gray-800">{t('exportPrint')}</h2>
                <button 
                    onClick={handlePrint} 
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2 disabled:bg-gray-400"
                    disabled={Object.values(selectedReports).every(v => !v)}
                >
                    <span className="material-symbols-outlined">print</span>
                    {t('printExportPDF')}
                </button>
            </div>
            
            <p className="mb-6 text-gray-600 no-print">
                Select the timetables you wish to include in the print/export. The selected reports will be rendered below for printing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 no-print">
                {/* Student Timetables */}
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-3">{t('studentTimetableA')}</h3>
                    <div className="mb-4">
                        <label htmlFor="grade-filter" className="block text-sm font-medium text-gray-700 mb-1">{t('filterByGrade')}</label>
                        <select
                            id="grade-filter"
                            value={selectedGrade}
                            onChange={e => setSelectedGrade(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            {uniqueGrades.map(grade => <option key={grade} value={grade}>{grade === 'all' ? t('allGrades') : grade}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <button onClick={() => handleSelectVisible('class', true)} className="text-xs bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 transition-colors">{t('selectAllVisible')}</button>
                        <button onClick={() => handleSelectVisible('class', false)} className="text-xs bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 transition-colors">{t('deselectAllVisible')}</button>
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto pr-2 border rounded-md p-2 bg-gray-50">
                        {filteredClassGrades.map(cg => (
                             <label key={cg.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={!!selectedReports[cg.id]}
                                    onChange={() => handleCheckboxChange(cg.id)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-800">{cg.name}</span>
                            </label>
                        ))}
                         {filteredClassGrades.length === 0 && <p className="text-center text-gray-500 p-4">No classes match this filter.</p>}
                    </div>
                </div>
                {/* Teacher Timetables */}
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-3">{t('teacherTimetableB')}</h3>
                    <div className="mb-4">
                        <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 mb-1">{t('filterByDepartment')}</label>
                        <select
                            id="department-filter"
                            value={selectedDepartment}
                            onChange={e => setSelectedDepartment(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            {uniqueDepartments.map(dept => <option key={dept} value={dept}>{dept === 'all' ? t('allDepartments') : dept}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <button onClick={() => handleSelectVisible('teacher', true)} className="text-xs bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 transition-colors">{t('selectAllVisible')}</button>
                        <button onClick={() => handleSelectVisible('teacher', false)} className="text-xs bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 transition-colors">{t('deselectAllVisible')}</button>
                    </div>
                     <div className="space-y-1 max-h-60 overflow-y-auto pr-2 border rounded-md p-2 bg-gray-50">
                        {filteredTeachers.map(teacher => (
                            <label key={teacher.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={!!selectedReports[teacher.id]}
                                    onChange={() => handleCheckboxChange(teacher.id)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-800">{teacher.prefix} {teacher.name} {teacher.lastName}</span>
                            </label>
                        ))}
                         {filteredTeachers.length === 0 && <p className="text-center text-gray-500 p-4">No teachers match this filter.</p>}
                    </div>
                </div>
            </div>

            <div className="printable-area mt-8">
                {classGrades.filter(cg => selectedReports[cg.id]).map(cg => (
                    <TemplateA key={cg.id} timetableState={timetableState} t={t} classId={cg.id} />
                ))}
                {teachers.filter(t => selectedReports[t.id]).map(teacher => (
                    <TemplateB key={teacher.id} timetableState={timetableState} t={t} teacherId={teacher.id} />
                ))}
            </div>
        </div>
    );
};

export default ExportPrintView;