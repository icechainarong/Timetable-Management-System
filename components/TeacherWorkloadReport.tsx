import React, { useMemo } from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { Translator, Teacher, ScheduleEntry, Subject, EventActivity, ClassGrade } from '../types';

interface TeacherWorkloadReportProps {
  timetableState: UseTimetableReturn;
  t: Translator;
}

interface ReportRow {
    id: string; // subject or event id
    codeName: string;
    periodsPerWeek: number;
    classesDisplay: string;
    numClasses: number;
    isAcademic: boolean;
}

interface ProcessedTeacherData {
    teacher: Teacher;
    department: string;
    advisorFor: string;
    reportRows: ReportRow[];
    totalAcademicPeriods: number;
    totalAllPeriods: number;
    totalHoursPerWeek: number;
    workloadStatus: 'onTrack' | 'belowStandard' | 'overloaded';
}

/**
 * Condenses a list of class names into a more readable string.
 * e.g., ['M.1/1', 'M.1/2', 'M.1/3', 'M.1/5'] becomes 'M.1/1, M.1/2, M.1/3, M.1/5'
 * e.g., ['M.1/1', 'M.1/2', 'M.1/3', 'M.1/4'] becomes 'M.1/1-4'
 */
const condenseClassNames = (classNames: string[]): string => {
    if (!classNames || classNames.length === 0) return '';

    const grouped: Record<string, number[]> = {};
    const unmatchable: string[] = [];
    classNames.forEach(name => {
        const match = name.match(/^(.+?)\/(\d+)$/);
        if (match) {
            const [, prefix, numStr] = match;
            const num = parseInt(numStr, 10);
            if (!grouped[prefix]) grouped[prefix] = [];
            grouped[prefix].push(num);
        } else {
            unmatchable.push(name);
        }
    });

    const resultParts: string[] = [];

    Object.keys(grouped).forEach(prefix => {
        const numbers = [...new Set(grouped[prefix])].sort((a, b) => a - b);
        if (numbers.length === 0) return;

        const ranges: number[][] = [];
        if (numbers.length > 0) {
            let currentRange: number[] = [numbers[0]];
            for (let i = 1; i < numbers.length; i++) {
                if (numbers[i] === numbers[i - 1] + 1) {
                    currentRange.push(numbers[i]);
                } else {
                    ranges.push(currentRange);
                    currentRange = [numbers[i]];
                }
            }
            ranges.push(currentRange);
        }

        const formattedRanges = ranges.map(range => {
            if (range.length === 1) {
                return `${prefix}/${range[0]}`;
            } else if (range.length <= 3) { // Threshold for listing vs range
                return range.map(n => `${prefix}/${n}`).join(', ');
            } else {
                return `${prefix}/${range[0]}-${range[range.length - 1]}`;
            }
        });

        resultParts.push(formattedRanges.join(', '));
    });

    return [...resultParts, ...unmatchable].join(', ');
};


export const TeacherWorkloadReport: React.FC<TeacherWorkloadReportProps> = ({ timetableState, t }) => {
    const { settings, schedule, teachers, departments, subjects, eventActivities, classGrades, findSubject, findEventActivity, findClassGrade } = timetableState;

    const processedData = useMemo<ProcessedTeacherData[]>(() => {
        const departmentOrderMap = new Map(departments.map((dep, index) => [dep, index]));

        const teachersByDept = teachers.reduce((acc, teacher) => {
            const dept = teacher.department;
            if (!acc[dept]) {
                acc[dept] = [];
            }
            acc[dept].push(teacher);
            return acc;
        }, {} as Record<string, Teacher[]>);

        const sortedDepartmentKeys = Object.keys(teachersByDept).sort((a, b) => {
            const orderA = departmentOrderMap.get(a) ?? Infinity;
            const orderB = departmentOrderMap.get(b) ?? Infinity;
            if (orderA === Infinity && orderB === Infinity) {
                return a.localeCompare(b);
            }
            return orderA - orderB;
        });

        const sortedTeachers = sortedDepartmentKeys.flatMap(dept => teachersByDept[dept]);
        
        return sortedTeachers.map(teacher => {
            const advisorForClasses = classGrades.filter(cg => cg.advisorIds?.includes(teacher.id)).map(cg => cg.name).join(', ');

            const teacherSchedule = schedule.filter(entry => 
                entry.teacherIds?.includes(teacher.id) ||
                (entry.eventActivityId && findEventActivity(entry.eventActivityId)?.affectedTeacherIds?.includes(teacher.id))
            );

            const groupedEntries: Record<string, ScheduleEntry[]> = {};
            teacherSchedule.forEach(entry => {
                const key = entry.subjectId || entry.eventActivityId || 'unknown';
                if (!groupedEntries[key]) {
                    groupedEntries[key] = [];
                }
                groupedEntries[key].push(entry);
            });

            const reportRows: ReportRow[] = Object.entries(groupedEntries).map(([itemId, entries]) => {
                const isSubject = !!findSubject(itemId);
                const item = isSubject ? findSubject(itemId) : findEventActivity(itemId);
                
                if (!item) return null;

                const classIds = [...new Set(entries.map(e => e.classGradeId).filter(Boolean) as string[])];
                const numClasses = classIds.length;
                
                const periodsPerWeek = numClasses > 0 ? entries.filter(e => e.classGradeId === classIds[0]).length : entries.length;

                const classNames = classIds.map(id => findClassGrade(id)?.name).filter((name): name is string => !!name);
                const classesDisplay = condenseClassNames(classNames);

                return {
                    id: itemId,
                    codeName: `${isSubject ? `[${(item as Subject).subjectCode}] ` : ''}${item.name}`,
                    periodsPerWeek,
                    classesDisplay: classesDisplay,
                    numClasses,
                    isAcademic: isSubject ? (item as Subject).isAcademic : (item as EventActivity).calculateWorkingHour ?? false,
                };
            }).filter((row): row is ReportRow => row !== null);
            
            const totalAcademicPeriods = teacherSchedule.filter(e => {
                if (!e.subjectId) return false;
                const subject = findSubject(e.subjectId);
                return subject?.isAcademic === true;
            }).length;

            const totalAllPeriods = teacherSchedule.filter(e => {
                if (e.subjectId) {
                    return !!findSubject(e.subjectId);
                }
                if (e.eventActivityId) {
                    const event = findEventActivity(e.eventActivityId);
                    return event?.calculateWorkingHour === true;
                }
                return false;
            }).length;
            
            // Safely access settings properties to prevent crashes and ensure valid calculations.
            const minutesPerPeriod = settings?.minutesPerPeriod || 0;
            const workloadMinHours = settings?.workloadMinHours || 0;
            const workloadMaxHours = settings?.workloadMaxHours || Infinity;
            const totalHoursPerWeek = (totalAllPeriods * minutesPerPeriod) / 60;

            let workloadStatus: ProcessedTeacherData['workloadStatus'] = 'onTrack';
            if (totalHoursPerWeek < workloadMinHours) {
                workloadStatus = 'belowStandard';
            } else if (totalHoursPerWeek > workloadMaxHours) {
                workloadStatus = 'overloaded';
            }

            return {
                teacher,
                department: teacher.department,
                advisorFor: advisorForClasses,
                reportRows,
                totalAcademicPeriods,
                totalAllPeriods,
                totalHoursPerWeek,
                workloadStatus,
            };
        });
    }, [teachers, departments, schedule, classGrades, subjects, eventActivities, settings, findClassGrade, findEventActivity, findSubject]);

    const getStatusChip = (status: ProcessedTeacherData['workloadStatus']) => {
        const styles = {
            onTrack: 'bg-green-100 text-green-800',
            belowStandard: 'bg-yellow-100 text-yellow-800',
            overloaded: 'bg-red-100 text-red-800',
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{t(status)}</span>;
    };
    
    const handlePrint = () => window.print();

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6 no-print">
                <h2 className="text-xl font-bold text-gray-800">{t('teacherWorkloadSummary')}</h2>
                <button onClick={handlePrint} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2">
                    <span className="material-symbols-outlined">print</span>
                    {t('printExportPDF')}
                </button>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] print:overflow-visible print:max-h-none printable-container !p-0 !shadow-none !border-none !max-w-none !aspect-auto">
                <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-gray-100">
                        <tr className="sticky top-0 z-20 bg-gray-100 print:static">
                            <th className="p-2 border font-semibold text-center">{t('no')}</th>
                            <th className="p-2 border font-semibold text-left">{t('fullName')} / {t('advisorFor')}</th>
                            <th className="p-2 border font-semibold text-left">{t('subjectCodeName')}</th>
                            <th className="p-2 border font-semibold text-center">{t('periodsPerWeekShort')}</th>
                            <th className="p-2 border font-semibold text-center">{t('gradeLevelShort')}</th>
                            <th className="p-2 border font-semibold text-center">{t('numClassesShort')}</th>
                            <th className="p-2 border font-semibold text-center">{t('totalAcademicPeriods')}</th>
                            <th className="p-2 border font-semibold text-center">{t('totalAllPeriods')}</th>
                            <th className="p-2 border font-semibold text-center">{t('totalHoursWeek')}</th>
                            <th className="p-2 border font-semibold text-center">{t('workloadCheck')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            let lastDepartment: string | null = null;
                            let departmentRowIndex = 0;
                            return processedData.map((data) => {
                                const isNewDepartment = data.department !== lastDepartment;
                                if (isNewDepartment) {
                                    departmentRowIndex = 1;
                                } else {
                                    departmentRowIndex++;
                                }

                                const departmentHeader = isNewDepartment ? (
                                        <tr className="bg-gray-200 font-bold text-left sticky top-10 z-10 print:static">
                                            <td colSpan={10} className="p-2 border text-gray-800">
                                                {data.department}
                                            </td>
                                        </tr>
                                    ) : null;
                                lastDepartment = data.department;
                                
                                const firstRow = data.reportRows[0];
                                const otherRows = data.reportRows.slice(1);
                                const rowCount = data.reportRows.length || 1;

                                let teacherRows;
                                if (!firstRow) { // Handle teachers with no assigned schedule
                                    teacherRows = (
                                        <tr className="border-t">
                                            <td className="p-2 border text-center font-medium">{departmentRowIndex}</td>
                                            <td className="p-2 border font-medium">
                                                <p>{`${data.teacher.prefix} ${data.teacher.name} ${data.teacher.lastName}`}</p>
                                                <p className="text-xs text-gray-500">{data.advisorFor ? `(${t('advisorFor')}: ${data.advisorFor})` : ''}</p>
                                            </td>
                                            <td className="p-2 border text-center text-gray-500" colSpan={4}>- No schedule entries -</td>
                                            <td className="p-2 border text-center font-bold">0</td>
                                            <td className="p-2 border text-center font-bold">0</td>
                                            <td className="p-2 border text-center font-bold">0.00</td>
                                            <td className="p-2 border text-center">{getStatusChip('belowStandard')}</td>
                                        </tr>
                                    );
                                } else {
                                    teacherRows = (
                                        <React.Fragment>
                                            <tr className="border-t">
                                                <td rowSpan={rowCount} className="p-2 border text-center align-top font-medium">{departmentRowIndex}</td>
                                                <td rowSpan={rowCount} className="p-2 border align-top font-medium">
                                                    <p>{`${data.teacher.prefix} ${data.teacher.name} ${data.teacher.lastName}`}</p>
                                                    <p className="text-xs text-gray-500">{data.advisorFor ? `(${t('advisorFor')}: ${data.advisorFor})` : ''}</p>
                                                </td>
                                                <td className="p-2 border">{firstRow.codeName}</td>
                                                <td className="p-2 border text-center">{firstRow.periodsPerWeek}</td>
                                                <td className="p-2 border text-center">{firstRow.classesDisplay}</td>
                                                <td className="p-2 border text-center">{firstRow.numClasses}</td>
                                                <td rowSpan={rowCount} className="p-2 border text-center align-middle font-bold">{data.totalAcademicPeriods}</td>
                                                <td rowSpan={rowCount} className="p-2 border text-center align-middle font-bold">{data.totalAllPeriods}</td>
                                                <td rowSpan={rowCount} className="p-2 border text-center align-middle font-bold">{data.totalHoursPerWeek.toFixed(2)}</td>
                                                <td rowSpan={rowCount} className="p-2 border text-center align-middle">{getStatusChip(data.workloadStatus)}</td>
                                            </tr>
                                            {otherRows.map(row => (
                                                <tr key={row.id}>
                                                    <td className="p-2 border">{row.codeName}</td>
                                                    <td className="p-2 border text-center">{row.periodsPerWeek}</td>
                                                    <td className="p-2 border text-center">{row.classesDisplay}</td>
                                                    <td className="p-2 border text-center">{row.numClasses}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                }
                                
                                return (
                                    <React.Fragment key={data.teacher.id}>
                                        {departmentHeader}
                                        {teacherRows}
                                    </React.Fragment>
                                );
                            });
                        })()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};