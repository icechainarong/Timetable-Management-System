import React, { useMemo } from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { Translator, Teacher, Subject, ClassGrade, Room } from '../types';
import { getDaysOfWeek } from '../i18n';

interface DashboardViewProps {
  timetableState: UseTimetableReturn;
  t: Translator;
}

// --- Reusable UI Components ---
const ReportCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-3xl text-blue-500">{icon}</span>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>
        <div className="space-y-6">{children}</div>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">{title}</h3>
        <div className="space-y-4 text-gray-600">{children}</div>
    </div>
);

const InfoPill: React.FC<{ value: string | number; label: string; className?: string }> = ({ value, label, className = '' }) => (
    <div className={`text-center p-2 rounded-lg bg-gray-100 ${className}`}>
        <p className="text-2xl font-bold text-blue-600">{value}</p>
        <p className="text-xs text-gray-500 uppercase font-medium">{label}</p>
    </div>
);


export const DashboardView: React.FC<DashboardViewProps> = ({ timetableState, t }) => {
    const { schedule, teachers, subjects, rooms, classGrades, settings, conflicts } = timetableState;
    const DAYS_OF_WEEK = getDaysOfWeek(t);

    // --- Analysis Logic ---
    const analysisResults = useMemo(() => {
        // --- Part 1: Teacher-Centric Analysis ---
        const teacherWorkloads = teachers.map(teacher => {
            const periods = schedule.filter(e => e.teacherIds?.includes(teacher.id)).length;
            return { teacher, periods };
        }).sort((a, b) => b.periods - a.periods);

        const workloadQuantile = Math.ceil(teacherWorkloads.length * 0.1);
        const busiestTeachers = teacherWorkloads.slice(0, workloadQuantile);
        const leastBusyTeachers = teacherWorkloads.slice(-workloadQuantile).reverse();
        
        const departmentWorkload = teachers.reduce((acc: Record<string, { teachers: string[], periods: number[] }>, teacher) => {
            if (!acc[teacher.department]) {
                acc[teacher.department] = { teachers: [], periods: [] };
            }
            acc[teacher.department].teachers.push(teacher.name);
            const workload = teacherWorkloads.find(w => w.teacher.id === teacher.id)?.periods || 0;
            acc[teacher.department].periods.push(workload);
            return acc;
        }, {});

        const departmentStats = Object.entries(departmentWorkload).map(([name, data]) => {
            const typedData = data as { periods: number[] };
            if (typedData.periods.length === 0) {
                return { name, avg: 0, min: 0, max: 0 };
            }
            const sum = typedData.periods.reduce((a, b) => a + b, 0);
            return {
                name,
                avg: sum / typedData.periods.length,
                min: Math.min(...typedData.periods),
                max: Math.max(...typedData.periods),
            };
        });

        const consecutiveTeaching = teachers.flatMap(teacher => {
            return Array.from({ length: settings?.daysPerWeek || 0 }).flatMap((_, dayIndex: number) => {
                const teacherPeriods = schedule
                    .filter(e => e.day === dayIndex && e.teacherIds?.includes(teacher.id))
                    .map(e => e.period)
                    .sort((a, b) => a - b);
                
                if (teacherPeriods.length < 4) return [];
                
                const sequences = [];
                let currentSequence = [teacherPeriods[0]];
                for (let i = 1; i < teacherPeriods.length; i++) {
                    if (teacherPeriods[i] === teacherPeriods[i-1] + 1) {
                        currentSequence.push(teacherPeriods[i]);
                    } else {
                        if (currentSequence.length >= 4) sequences.push(currentSequence);
                        currentSequence = [teacherPeriods[i]];
                    }
                }
                if (currentSequence.length >= 4) sequences.push(currentSequence);
                
                return sequences.map(seq => ({
                    teacherName: `${teacher.name} ${teacher.lastName}`,
                    day: DAYS_OF_WEEK[dayIndex],
                    periods: seq.map(p => p + 1).join(', ')
                }));
            });
        });

        const inefficientGaps = teachers.map(teacher => {
            let gapCount = 0;
            for (let i = 0; i < (settings?.daysPerWeek || 0); i++) {
                const dayPeriods = schedule.filter(e => e.day === i && e.teacherIds?.includes(teacher.id)).map(e => e.period).sort((a, b) => a - b);
                for (let j = 1; j < dayPeriods.length; j++) {
                    if (dayPeriods[j] - dayPeriods[j-1] === 2) {
                        gapCount++;
                    }
                }
            }
            return { teacherName: `${teacher.name} ${teacher.lastName}`, gaps: gapCount };
        }).filter(t => t.gaps > 0).sort((a, b) => b.gaps - a.gaps);

        const classroomMobility = teachers.map(teacher => {
            let totalChanges = 0;
            for (let i = 0; i < (settings?.daysPerWeek || 0); i++) {
                const daySchedule = schedule.filter(e => e.day === i && e.teacherIds?.includes(teacher.id) && e.roomId).sort((a, b) => a.period - b.period);
                for (let j = 1; j < daySchedule.length; j++) {
                    if (daySchedule[j].roomId !== daySchedule[j-1].roomId) {
                        totalChanges++;
                    }
                }
            }
            return { teacherName: `${teacher.name} ${teacher.lastName}`, avgChanges: totalChanges / (settings?.daysPerWeek || 1) };
        }).filter(t => t.avgChanges > 0).sort((a, b) => b.avgChanges - a.avgChanges);


        // --- Part 2: Student-Centric Analysis ---
        const subjectsMap = new Map(subjects.map(s => [s.id, s]));
        const academicSubjects = new Set(subjects.filter(s => s.isAcademic).map(s => s.id));
        
        const cognitiveLoadIssues = classGrades.flatMap(cg => {
            return Array.from({length: settings?.daysPerWeek || 0}).flatMap((_, dayIndex: number) => {
                const daySchedule = schedule.filter(e => e.day === dayIndex && e.classGradeId === cg.id).sort((a,b) => a.period - b.period);
                if (daySchedule.length < 3) return [];

                let consecutiveCount = 0;
                for (const entry of daySchedule) {
                    if (entry.subjectId && academicSubjects.has(entry.subjectId)) {
                        consecutiveCount++;
                    } else {
                        consecutiveCount = 0;
                    }
                    if (consecutiveCount > 3) {
                        return { className: cg.name, day: DAYS_OF_WEEK[dayIndex] };
                    }
                }
                return [];
            });
        });

        const academicBalanceIssues = classGrades.flatMap(cg => {
            return Array.from({length: settings?.daysPerWeek || 0}).flatMap((_, dayIndex: number) => {
                const daySchedule = schedule.filter(e => e.day === dayIndex && e.classGradeId === cg.id);
                if (daySchedule.length > 0 && daySchedule.every(e => e.subjectId && academicSubjects.has(e.subjectId))) {
                    return { className: cg.name, day: DAYS_OF_WEEK[dayIndex] };
                }
                return [];
            });
        });

        const lunchPeriod = Math.floor((settings?.periodsPerDay || 0) / 2);
        const academicTiming = classGrades.map(cg => {
            const classSchedule = schedule.filter(e => e.classGradeId === cg.id && e.subjectId && academicSubjects.has(e.subjectId));
            const morning = classSchedule.filter(e => e.period < lunchPeriod).length;
            const afternoon = classSchedule.filter(e => e.period >= lunchPeriod).length;
            const total = morning + afternoon;
            return {
                className: cg.name,
                morningPct: total > 0 ? (morning / total * 100).toFixed(0) : 0,
                afternoonPct: total > 0 ? (afternoon / total * 100).toFixed(0) : 0,
            };
        });

        // --- Part 3: Resource Analysis ---
        const roomTypeUtilization: Record<string, { used: number, total: number }> = {};
        const roomSpecificUtilization: Record<string, { used: number, name: string }> = {};
        const totalPeriodsAvailable = (settings?.daysPerWeek || 0) * (settings?.periodsPerDay || 0);

        rooms.forEach(room => {
            const type = room.name.includes("Lab") ? "Lab" : room.name.includes("Hall") ? "Hall" : "Classroom";
            if (!roomTypeUtilization[type]) roomTypeUtilization[type] = { used: 0, total: 0 };
            roomTypeUtilization[type].total += totalPeriodsAvailable * (room.capacity || 1);
            
            const usedPeriods = schedule.filter(e => e.roomId === room.id).length;
            roomTypeUtilization[type].used += usedPeriods;
            roomSpecificUtilization[room.id] = { used: usedPeriods, name: room.name };
        });

        const overUtilizedRooms = Object.values(roomSpecificUtilization).filter(r => totalPeriodsAvailable > 0 && (r.used / totalPeriodsAvailable) > 0.9);
        const underUtilizedRooms = Object.values(roomSpecificUtilization).filter(r => totalPeriodsAvailable > 0 && (r.used / totalPeriodsAvailable) < 0.4);

        // --- Generate Recommendations ---
        const recommendations: string[] = [];
        if (consecutiveTeaching.length > 0) recommendations.push(`Revise schedules for teachers with 4+ consecutive teaching blocks to prevent burnout (e.g., ${consecutiveTeaching[0].teacherName} on ${consecutiveTeaching[0].day}).`);
        if (inefficientGaps.length > 0) recommendations.push(`Address single-period gaps for teachers like ${inefficientGaps[0].teacherName} to improve schedule efficiency.`);
        if (cognitiveLoadIssues.length > 0) recommendations.push(`Balance the schedule for ${cognitiveLoadIssues[0].className} on ${cognitiveLoadIssues[0].day} by inserting non-academic subjects between core classes.`);
        if (overUtilizedRooms.length > 0) recommendations.push(`The high utilization of rooms like ${overUtilizedRooms[0].name} suggests a resource bottleneck. Consider reallocating classes or converting another room.`);
        if (underUtilizedRooms.length > 0) recommendations.push(`Investigate the low usage of ${underUtilizedRooms[0].name} to see if it can be repurposed or used more effectively.`);


        return {
            teacherWorkloads, busiestTeachers, leastBusyTeachers, departmentStats,
            consecutiveTeaching, inefficientGaps, classroomMobility,
            cognitiveLoadIssues, academicBalanceIssues, academicTiming,
            roomTypeUtilization, roomSpecificUtilization, overUtilizedRooms, underUtilizedRooms, totalPeriodsAvailable,
            recommendations
        };
    }, [schedule, teachers, subjects, rooms, classGrades, settings, DAYS_OF_WEEK, t]);

    const {
        busiestTeachers, leastBusyTeachers, departmentStats,
        consecutiveTeaching, inefficientGaps, classroomMobility,
        cognitiveLoadIssues, academicBalanceIssues, academicTiming,
        roomTypeUtilization, roomSpecificUtilization, overUtilizedRooms, underUtilizedRooms, totalPeriodsAvailable,
        recommendations
    } = analysisResults;

    return (
        <div className="space-y-8">
            <ReportCard title={t('executiveSummary')} icon="summarize">
                <p>This report analyzes the timetable across three key areas: teacher well-being, student learning, and resource utilization. Below are the most critical findings and actionable recommendations to create a more balanced and efficient schedule.</p>
            </ReportCard>
            
            <ReportCard title={t('recommendations')} icon="rule">
                {recommendations.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2">
                        {recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                ) : <p className="text-green-600 font-medium">{t('noIssuesFound')}</p>}
            </ReportCard>

            {/* Part 1: Teacher Analysis */}
            <ReportCard title={t('teacherAnalysis')} icon="person">
                <Section title={t('workloadDistribution')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2">{t('busiestTeachers')}</h4>
                            <ul className="text-sm space-y-1">{busiestTeachers.map(w => <li key={w.teacher.id} className="flex justify-between"><span>{w.teacher.name} {w.teacher.lastName}</span> <span className="font-mono">{w.periods} {t('periods')}</span></li>)}</ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">{t('leastBusyTeachers')}</h4>
                            <ul className="text-sm space-y-1">{leastBusyTeachers.map(w => <li key={w.teacher.id} className="flex justify-between"><span>{w.teacher.name} {w.teacher.lastName}</span> <span className="font-mono">{w.periods} {t('periods')}</span></li>)}</ul>
                        </div>
                    </div>
                    <h4 className="font-semibold mt-4 mb-2">{t('departmentWorkload')}</h4>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50"><tr><th className="p-2">Department</th><th className="p-2 text-center">{t('avg')}</th><th className="p-2 text-center">{t('min')}</th><th className="p-2 text-center">{t('max')}</th></tr></thead>
                        <tbody>{departmentStats.map(d => <tr key={d.name} className="border-b"><td className="p-2">{d.name}</td><td className="p-2 text-center">{d.avg.toFixed(1)}</td><td className="p-2 text-center">{d.min}</td><td className="p-2 text-center">{d.max}</td></tr>)}</tbody>
                    </table>
                </Section>
                <Section title={t('consecutiveTeaching')}>
                    {consecutiveTeaching.length > 0 ? <ul>{consecutiveTeaching.map((c,i) => <li key={i}>{c.teacherName} on {c.day} (Periods: {c.periods})</li>)}</ul> : <p>{t('noIssuesFound')}</p>}
                </Section>
                 <Section title={t('inefficientGaps')}>
                     {inefficientGaps.length > 0 ? <ul>{inefficientGaps.map(g => <li key={g.teacherName}>{g.teacherName}: {g.gaps} {t('gaps')}</li>)}</ul> : <p>{t('noIssuesFound')}</p>}
                </Section>
                <Section title={t('classroomMobility')}>
                     {classroomMobility.length > 0 ? <ul>{classroomMobility.slice(0, 5).map(m => <li key={m.teacherName}>{m.teacherName}: {m.avgChanges.toFixed(1)} {t('dailyRoomChanges')}</li>)}</ul> : <p>{t('noIssuesFound')}</p>}
                </Section>
            </ReportCard>
            
             {/* Part 2: Student Analysis */}
            <ReportCard title={t('studentAnalysis')} icon="school">
                 <Section title={t('cognitiveLoad')}>
                    <h4 className="font-semibold mb-2">{t('consecutiveAcademicSubjects')}</h4>
                    {cognitiveLoadIssues.length > 0 ? <ul>{cognitiveLoadIssues.map((c,i) => <li key={i}>{c.className} on {c.day}</li>)}</ul> : <p>{t('noIssuesFound')}</p>}
                    <h4 className="font-semibold mt-4 mb-2">{t('academicBalance')}</h4>
                    {academicBalanceIssues.length > 0 ? <ul>{academicBalanceIssues.map((c,i) => <li key={i}>{c.className} on {c.day}</li>)}</ul> : <p>{t('noIssuesFound')}</p>}
                </Section>
                 <Section title={t('optimalTiming')}>
                    <h4 className="font-semibold mb-2">{t('academicTiming')}</h4>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {academicTiming.map(c => <div key={c.className} className="p-2 bg-gray-50 rounded text-center"><p className="font-bold text-sm">{c.className}</p><p className="text-xs">{c.morningPct}% {t('morning')} / {c.afternoonPct}% {t('afternoon')}</p></div>)}
                    </div>
                </Section>
            </ReportCard>

             {/* Part 3: Resource Analysis */}
            <ReportCard title={t('resourceAnalysis')} icon="table_restaurant">
                <Section title={t('roomUtil')}>
                    <h4 className="font-semibold mb-2">{t('roomTypeUtilization')}</h4>
                    <div className="grid grid-cols-3 gap-4">
                        {Object.entries(roomTypeUtilization).map(([type, data]) => {
                            const typedData = data as { used: number; total: number };
                            const utilization = typedData.total > 0 ? (typedData.used / typedData.total) * 100 : 0;
                            return <InfoPill key={type} value={`${utilization.toFixed(0)}%`} label={type} />;
                        })}
                    </div>
                     <h4 className="font-semibold mt-4 mb-2">{t('overUtilized')}</h4>
                    {overUtilizedRooms.length > 0 ? <ul className="text-sm">{overUtilizedRooms.map(r => <li key={r.name}>{r.name} ({((r.used/totalPeriodsAvailable)*100).toFixed(0)}%)</li>)}</ul> : <p className="text-sm">{t('noIssuesFound')}</p>}
                    <h4 className="font-semibold mt-4 mb-2">{t('underUtilized')}</h4>
                    {underUtilizedRooms.length > 0 ? <ul className="text-sm">{underUtilizedRooms.map(r => <li key={r.name}>{r.name} ({((r.used/totalPeriodsAvailable)*100).toFixed(0)}%)</li>)}</ul> : <p className="text-sm">{t('noIssuesFound')}</p>}
                </Section>
                <Section title={t('clashDetection')}>
                    {conflicts.length > 0 ? <p className="text-red-600 font-bold">{t('conflictsFound')}</p> : <p className="text-green-600 font-bold">{t('noConflicts')}</p>}
                </Section>
            </ReportCard>
        </div>
    );
};