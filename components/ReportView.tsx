
import React, { useState, useEffect } from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import { TemplateA } from './TemplateA';
import { TemplateB } from './TemplateB';
import type { Translator } from '../types';
import { FloatingSearchableSelect } from './FloatingSearchableSelect';

interface ReportViewProps {
  viewType: 'Student Timetable' | 'Teacher Timetable';
  timetableState: UseTimetableReturn;
  t: Translator;
}

export const ReportView: React.FC<ReportViewProps> = ({ viewType, timetableState, t }) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const isStudentView = viewType === 'Student Timetable';

  useEffect(() => {
    if (isStudentView) {
      setSelectedId(timetableState.classGrades[0]?.id || '');
    } else {
      setSelectedId(timetableState.teachers[0]?.id || '');
    }
  }, [viewType, timetableState.classGrades, timetableState.teachers, isStudentView]);

  const handlePrint = () => {
    window.print();
  };

  const titleKey = isStudentView ? 'studentTimetableA' : 'teacherTimetableB';
  const selectLabel = isStudentView ? t('selectClassGrade') : t('selectTeacher');
  const options = isStudentView 
    ? timetableState.classGrades.map(c => ({ id: c.id, name: c.name }))
    : timetableState.teachers.map(teacher => ({ id: teacher.id, name: `${teacher.prefix} ${teacher.name} ${teacher.lastName}` }));

  return (
    <div className="report-view-container">
      <div className="flex justify-between items-center mb-6 no-print bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t(titleKey)}</h2>
          <div className="mt-2 w-full max-w-xs">
            <FloatingSearchableSelect
                label={selectLabel}
                value={selectedId}
                onChange={(newValue) => setSelectedId(newValue as string)}
                options={options}
                t={t}
                placeholder={selectLabel}
            />
          </div>
        </div>
        <button onClick={handlePrint} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2 self-end">
          <span className="material-symbols-outlined">print</span>
          {t('printExportPDF')}
        </button>
      </div>

      {selectedId && (
        <>
          {isStudentView && <TemplateA timetableState={timetableState} t={t} classId={selectedId} />}
          {!isStudentView && <TemplateB timetableState={timetableState} t={t} teacherId={selectedId} />}
        </>
      )}
    </div>
  );
};
