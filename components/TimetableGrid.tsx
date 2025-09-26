import React, { useState, useEffect, useMemo } from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { ScheduleEntry, Translator, Teacher, EventActivity } from '../types';
import { UnscheduledItems } from './UnscheduledItems';
import { getDaysOfWeek } from '../i18n';
import { FloatingSearchableSelect } from './FloatingSearchableSelect';

type ViewMode = 'class' | 'teacher' | 'room';

interface DraggableItemData {
  type: 'scheduled';
  id: string;
  action: 'move' | 'copy';
}

interface DropData {
    type: 'unscheduled';
    subjectId: string;
    classGradeId: string;
}

interface TimetableGridProps {
  onCellClick: (options: {
    entry?: ScheduleEntry;
    day?: number;
    period?: number;
    prefill?: Partial<Omit<ScheduleEntry, 'id' | 'day' | 'period'>>;
  }) => void;
  timetableState: UseTimetableReturn;
  t: Translator;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({ onCellClick, timetableState, t }) => {
  const { settings, schedule, teachers, classGrades, rooms, findSubject, findEventActivity, findTeacher, findRoom, findClassGrade, moveSchedule, addSchedule } = timetableState;
  const [viewMode, setViewMode] = useState<ViewMode>('class');
  const [selectedId, setSelectedId] = useState<string>('');
  
  const DAYS_OF_WEEK = getDaysOfWeek(t);

  // OPTIMIZATION: Pre-process the schedule into a Map for fast lookups.
  // This is the key fix to prevent client disconnects by making re-renders much faster.
  const entriesByDayPeriod = useMemo(() => {
    if (!selectedId) return new Map<string, ScheduleEntry[]>();

    const relevantEntries = schedule.filter(entry => {
        // Direct check
        if (viewMode === 'class' && entry.classGradeId === selectedId) return true;
        if (viewMode === 'teacher' && entry.teacherIds?.includes(selectedId)) return true;
        if (viewMode === 'room' && entry.roomId === selectedId) return true;

        // Indirect check (via event)
        if (entry.eventActivityId) {
            const event = findEventActivity(entry.eventActivityId);
            if (event) {
                if (viewMode === 'class' && event.affectedClassGradeIds?.includes(selectedId)) return true;
                if (viewMode === 'teacher' && event.affectedTeacherIds?.includes(selectedId)) return true;
            }
        }
        return false;
    });

    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of relevantEntries) {
        const key = `${entry.day}-${entry.period}`;
        const existing = map.get(key) || [];
        existing.push(entry);
        map.set(key, existing);
    }
    
    return map;
  }, [schedule, selectedId, viewMode, findEventActivity]);

  useEffect(() => {
    if (viewMode === 'class' && classGrades.length > 0) {
      setSelectedId(classGrades[0].id);
    } else if (viewMode === 'teacher' && teachers.length > 0) {
      setSelectedId(teachers[0].id);
    } else if (viewMode === 'room' && rooms.length > 0) {
      setSelectedId(rooms[0].id);
    } else {
      setSelectedId('');
    }
  }, [viewMode, classGrades, teachers, rooms]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, entry: ScheduleEntry) => {
    const isCopy = e.ctrlKey || e.metaKey;
    const data: DraggableItemData = { type: 'scheduled', id: entry.id, action: isCopy ? 'copy' : 'move' };
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = isCopy ? 'copy' : 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: number, period: number) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.classList.remove('bg-blue-200', 'ring-2', 'ring-blue-400');

    try {
        const dataString = e.dataTransfer.getData('application/json');
        if (!dataString) return;
        const data = JSON.parse(dataString);

        if (data.type === 'scheduled') {
            const scheduledData = data as DraggableItemData;
            if (scheduledData.action === 'copy') {
                const originalEntry = schedule.find(entry => entry.id === scheduledData.id);
                if (originalEntry) {
                    const { id, ...restOfEntry } = originalEntry;
                    addSchedule({ ...restOfEntry, day, period });
                }
            } else { // 'move' or undefined for backward compatibility
                moveSchedule(scheduledData.id, day, period);
            }
        } else if (data.type === 'unscheduled') {
            const { subjectId, classGradeId } = data as DropData;
            let prefill: Partial<Omit<ScheduleEntry, 'id' | 'day' | 'period'>> = {
                subjectId,
                classGradeId,
            };

            // Prefill teacher or room based on current view
            if (viewMode === 'teacher') {
                prefill.teacherIds = [selectedId];
            } else if (viewMode === 'room') {
                prefill.roomId = selectedId;
            }

            onCellClick({ day, period, prefill });
        }
    } catch (error) {
        console.error("Error handling drop:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const isCopy = e.ctrlKey || e.metaKey;
    e.dataTransfer.dropEffect = isCopy ? 'copy' : 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.classList.add('bg-blue-200', 'ring-2', 'ring-blue-400');
  };
    
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLDivElement;
      target.classList.remove('bg-blue-200', 'ring-2', 'ring-blue-400');
  };

  const getEntriesForCell = (day: number, period: number) => {
    return entriesByDayPeriod.get(`${day}-${period}`) || [];
  };

  const renderGridCellContent = (entry: ScheduleEntry) => {
    const item = entry.subjectId ? findSubject(entry.subjectId) : findEventActivity(entry.eventActivityId || '');
    if (!item) return null;

    const classGrade = entry.classGradeId ? findClassGrade(entry.classGradeId) : null;
    const room = entry.roomId ? findRoom(entry.roomId) : null;
    const mainText = item.name;

    let subText1 = '';
    let subText2 = '';
    
    // Helper to get the correct teacher display string
    const getTeacherDisplayString = (scheduleEntry: ScheduleEntry, eventItem?: EventActivity): string => {
        let displayTeachers: Teacher[] = [];

        if (scheduleEntry.subjectId) {
            // For subjects, always use the teachers from the schedule entry itself.
            displayTeachers = (scheduleEntry.teacherIds || []).map(id => findTeacher(id)).filter((t): t is Teacher => !!t);
        } else if (scheduleEntry.eventActivityId && eventItem) {
            // For events, check for overrides on the schedule entry first.
            const teacherIdsFromEntry = scheduleEntry.teacherIds || [];
            if (teacherIdsFromEntry.length > 0) {
                 displayTeachers = teacherIdsFromEntry.map(id => findTeacher(id)).filter((t): t is Teacher => !!t);
            } else {
                // Otherwise, use the defaults from the event master data.
                const teacherIdsFromEvent = eventItem.affectedTeacherIds || [];
                displayTeachers = teacherIdsFromEvent.map(id => findTeacher(id)).filter((t): t is Teacher => !!t);
            }
        }
        
        if (displayTeachers.length > 1) {
            return t('multipleTeachers');
        }
        if (displayTeachers.length === 1) {
            const teacher = displayTeachers[0];
            return `${teacher.prefix} ${teacher.name} ${teacher.lastName}`;
        }
        return ''; // No teachers assigned
    };


    switch (viewMode) {
        case 'class':
            subText1 = getTeacherDisplayString(entry, entry.eventActivityId ? item as EventActivity : undefined);
            subText2 = room?.name || '';
            break;
        case 'teacher':
            subText1 = classGrade?.name || (item as any).affectedClassGradeIds?.length > 1 ? `${(item as any).affectedClassGradeIds?.length} ${t('classes')}` : (item as any).affectedClassGradeIds?.length === 1 ? findClassGrade((item as any).affectedClassGradeIds[0])?.name : '';
            subText2 = room?.name || '';
            break;
        case 'room':
            subText1 = classGrade?.name || '';
            subText2 = getTeacherDisplayString(entry, entry.eventActivityId ? item as EventActivity : undefined);
            break;
    }

    return (
      <div 
        key={entry.id}
        draggable 
        onDragStart={e => handleDragStart(e, entry)}
        onClick={(e) => { e.stopPropagation(); onCellClick({ entry }); }}
        className={`p-2 rounded-lg cursor-grab active:cursor-grabbing text-xs ${item.color} ${item.textColor} shadow-md mb-1`}
        title="Drag to move, Ctrl+Drag to copy"
      >
        <p className="font-bold truncate">{mainText}</p>
        <p className="truncate">{subText1}</p>
        <p className="truncate text-opacity-80">{subText2}</p>
      </div>
    );
  };
  
  const getSelectorProps = () => {
    switch (viewMode) {
      case 'class':
        return {
          label: t('class'),
          placeholder: t('selectClass'),
          options: classGrades.map(c => ({ id: c.id, name: c.name })),
        };
      case 'teacher':
        return {
          label: t('teacher'),
          placeholder: t('selectTeacher'),
          options: teachers.map(t => ({ id: t.id, name: `${t.prefix} ${t.name} ${t.lastName}` })),
        };
      case 'room':
        return {
          label: t('room'),
          placeholder: t('selectRoom'),
          options: rooms.map(r => ({ id: r.id, name: r.name })),
        };
      default:
        return { label: '', placeholder: '', options: [] };
    }
  };

  const selectorProps = getSelectorProps();

  return (
    <div>
      <div className="flex items-start space-x-4 mb-4">
        <div className="flex rounded-md shadow-sm self-end">
            <button onClick={() => setViewMode('class')} className={`px-4 py-2 text-sm font-medium border ${viewMode === 'class' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-l-md`}>{t('classView')}</button>
            <button onClick={() => setViewMode('teacher')} className={`px-4 py-2 text-sm font-medium border-t border-b ${viewMode === 'teacher' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t('teacherView')}</button>
            <button onClick={() => setViewMode('room')} className={`px-4 py-2 text-sm font-medium border ${viewMode === 'room' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-r-md`}>{t('roomView')}</button>
        </div>
        <div className="w-full max-w-xs">
            <FloatingSearchableSelect
                label={selectorProps.label}
                value={selectedId}
                onChange={(newValue) => setSelectedId(newValue as string)}
                options={selectorProps.options}
                t={t}
                placeholder={selectorProps.placeholder}
            />
        </div>
      </div>

      <div className="overflow-auto bg-white rounded-lg shadow-lg">
        <div className="grid" style={{ gridTemplateColumns: `minmax(100px, auto) repeat(${settings?.periodsPerDay || 0}, minmax(120px, 1fr))` }}>
          {/* Header Row: Top-left corner + Periods */}
          <div className="p-2 border-b border-r bg-gray-50 sticky top-0 left-0 z-20"></div>
          {Array.from({ length: settings?.periodsPerDay || 0 }).map((_, periodIndex) => (
            <div key={periodIndex} className="text-center font-bold p-3 border-b border-r bg-gray-100 sticky top-0 z-10">
              <div>{t('period')} {periodIndex + 1}</div>
              <div className="text-xs text-gray-500 font-normal">{(settings?.periodTimes || [])[periodIndex] || ''}</div>
            </div>
          ))}

          {/* Grid Rows: Days */}
          {DAYS_OF_WEEK.slice(0, settings?.daysPerWeek || 0).map((day, dayIndex) => (
            <React.Fragment key={dayIndex}>
              <div className="p-2 border-b border-r text-center font-semibold bg-gray-50 flex items-center justify-center sticky left-0 z-10">
                {day}
              </div>
              {Array.from({ length: settings?.periodsPerDay || 0 }).map((_, periodIndex) => {
                const entries = getEntriesForCell(dayIndex, periodIndex);
                const prefill = viewMode === 'class' ? { classGradeId: selectedId } : 
                                viewMode === 'teacher' ? { teacherIds: [selectedId] } :
                                viewMode === 'room' ? { roomId: selectedId } : {};

                return (
                  <div
                    key={`${dayIndex}-${periodIndex}`}
                    className="border-b border-r p-1 min-h-[100px] transition-colors relative cursor-pointer"
                    onDrop={(e) => handleDrop(e, dayIndex, periodIndex)}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onClick={() => entries.length === 0 && onCellClick({ day: dayIndex, period: periodIndex, prefill })}
                  >
                    {entries.map(entry => renderGridCellContent(entry))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {viewMode === 'class' && selectedId && <UnscheduledItems timetableState={timetableState} t={t} selectedClassId={selectedId} />}
    </div>
  );
};