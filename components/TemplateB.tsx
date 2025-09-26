import React from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { Translator, ScheduleEntry, Subject } from '../types';
import { getDaysOfWeek } from '../i18n';

interface TemplateBProps {
  timetableState: UseTimetableReturn;
  t: Translator;
  teacherId: string;
}

export const TemplateB: React.FC<TemplateBProps> = ({ timetableState, t, teacherId }) => {
  const { settings, schedule, institutionDetails, academicCalendar, printSettings, findSubject, findEventActivity, findTeacher, findRoom, findClassGrade } = timetableState;

  const teacherInfo = findTeacher(teacherId);
  if (!teacherInfo) {
    return <div className="p-4 text-red-500">Teacher not found.</div>;
  }

  const entriesByDayPeriod: { [key: string]: ScheduleEntry } = {};
  const teacherSchedule = schedule.filter(entry => 
      entry.teacherIds?.includes(teacherId) ||
      (entry.eventActivityId && findEventActivity(entry.eventActivityId)?.affectedTeacherIds?.includes(teacherId))
  );

  teacherSchedule.forEach(entry => {
      entriesByDayPeriod[`${entry.day}-${entry.period}`] = entry;
    });

  const DAYS_OF_WEEK = getDaysOfWeek(t);

  const subjectsTaught: { subject: Subject, periods: number }[] = [];
  teacherSchedule.forEach(entry => {
    if (entry.subjectId) {
        const subject = findSubject(entry.subjectId);
        if (subject) {
          const existing = subjectsTaught.find(s => s.subject.id === subject.id);
          if (existing) {
            existing.periods++;
          } else {
            subjectsTaught.push({ subject, periods: 1 });
          }
        }
    }
  });

  const totalPeriods = teacherSchedule.length;

  return (
    <div className="printable-container mb-8 print-page-break" id={`template-b-${teacherId}`}>
      {/* Header */}
      <header className="flex items-center justify-between mb-6 pb-4 border-b">
        <div className="flex items-center gap-4">
          {printSettings.showLogo && institutionDetails.logo && <img src={institutionDetails.logo} alt="Logo" className="h-20 w-20 object-contain" />}
          <div>
            <h1 className="text-xl font-bold text-gray-800">{institutionDetails.name}</h1>
            <p className="text-lg font-semibold text-gray-600">{t('teacherTimetableB')}</p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>{t('semester')} {academicCalendar.semester}</p>
          <p>{t('academicYear')} {academicCalendar.year}</p>
        </div>
      </header>

      {/* Teacher Info */}
      <div className="mb-6 flex justify-between">
          <p><span className="font-bold">{t('teacherName')}:</span> {teacherInfo.prefix} {teacherInfo.name} {teacherInfo.lastName}</p>
          <p><span className="font-bold">{t('teacherCode')}:</span> {teacherInfo.teacherCode || '-'}</p>
          <p><span className="font-bold">{t('department')}:</span> {teacherInfo.department}</p>
          <p><span className="font-bold">{t('totalPeriods')}:</span> {totalPeriods}</p>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <table className="min-w-full w-full border-collapse border border-gray-400 text-center table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border border-gray-300 font-semibold w-20">{t('day')} / {t('period')}</th>
              {Array.from({ length: settings?.periodsPerDay || 0 }).map((_, periodIndex) => (
                <th key={periodIndex} className="p-2 border border-gray-300 font-semibold">
                  <div>{periodIndex + 1}</div>
                  <div className="text-xs font-normal text-gray-500">{(settings?.periodTimes || [])[periodIndex] || ''}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS_OF_WEEK.slice(0, settings?.daysPerWeek || 0).map((day, dayIndex) => (
              <tr key={dayIndex}>
                <td className="p-2 border border-gray-300 font-semibold bg-gray-50 h-24" style={{ fontSize: '12pt' }}>{day}</td>
                {Array.from({ length: settings?.periodsPerDay || 0 }).map((_, periodIndex) => {
                  const entry = entriesByDayPeriod[`${dayIndex}-${periodIndex}`];
                  if (!entry) {
                    return <td key={periodIndex} className="p-1 border border-gray-300"></td>;
                  }
                  const item = entry.subjectId ? findSubject(entry.subjectId) : findEventActivity(entry.eventActivityId || '');
                  const classGrade = entry.classGradeId ? findClassGrade(entry.classGradeId) : null;
                  const room = entry.roomId ? findRoom(entry.roomId) : null;

                  const className = classGrade?.name || 
                    ((item as any).affectedClassGradeIds?.length > 1 ? `${(item as any).affectedClassGradeIds?.length} ${t('classes')}` : 
                     (item as any).affectedClassGradeIds?.length === 1 ? findClassGrade((item as any).affectedClassGradeIds[0])?.name : 'N/A');

                  let displayName: string;
                  if (entry.subjectId && item) {
                    displayName = (item as Subject).subjectCode;
                  } else {
                    displayName = item?.name || 'N/A';
                  }

                  const isBW = printSettings.colorMode === 'bw';
                  const cellClasses = isBW
                    ? 'p-1 rounded bg-transparent text-black'
                    : `p-1 rounded ${item?.color || 'bg-gray-200'} ${item?.textColor || 'text-black'}`;

                  return (
                    <td key={periodIndex} className="p-1 border border-gray-300 text-xs">
                       <div className={cellClasses}>
                        <p className="font-bold truncate">{displayName}</p>
                        {!entry.eventActivityId && (
                            <>
                                <p className="truncate">{className}</p>
                                <p className="truncate opacity-80">{room?.name || 'N/A'}</p>
                            </>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subjects Taught Summary */}
      <div className="mt-8">
        <h3 className="text-md font-bold mb-4">{t('subjectsTaught')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {subjectsTaught.map(({ subject, periods }) => (
                <div key={subject.id} className="p-0 border rounded-md bg-gray-50">
                    <div className="flex justify-between items-start">
                        <p className="font-bold">{subject.name}</p>
                        <p className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{subject.subjectCode}</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                        {periods} {t('periodsPerWeek')}
                    </p>
                </div>
            ))}
        </div>
      </div>
      
      {/* Footer / Signatures */}
      <footer className="mt-16 text-center text-sm">
        <div className="flex justify-around items-end">
            <div className="w-1/3">
                <div className="h-16 flex items-center justify-center">
                    {institutionDetails.deputyDirectorSignature && (
                        <img src={institutionDetails.deputyDirectorSignature} alt="Deputy Director Signature" className="max-h-full object-contain" />
                    )}
                </div>
                <p className="mt-2 border-t border-gray-400 pt-2">
                    ( {institutionDetails.deputyDirectorName || '.....................................................'} )
                </p>
                <p>{t('deputyDirectorAcademic')}</p>
            </div>
            <div className="w-1/3">
                <div className="h-16 flex items-center justify-center">
                    {institutionDetails.schoolDirectorSignature && (
                        <img src={institutionDetails.schoolDirectorSignature} alt="School Director Signature" className="max-h-full object-contain" />
                    )}
                </div>
                <p className="mt-2 border-t border-gray-400 pt-2">
                    ( {institutionDetails.schoolDirectorName || '.....................................................'} )
                </p>
                <p>{t('schoolDirector')}</p>
            </div>
        </div>
      </footer>
    </div>
  );
};