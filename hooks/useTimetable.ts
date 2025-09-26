import { useState, useCallback, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ScheduleEntry, Teacher, Subject, Room, ClassGrade, TimetableSettings, Conflict, InstitutionDetails, AcademicCalendar, EventActivity, PrintSettings, FullTimetableState, MasterDataType } from '../types';
export type { MasterDataType } from '../types';
import { useTimetableSocket, type ConnectionStatus } from './useTimetableSocket';
import { 
  DUMMY_PREFIXES,
  DUMMY_TEACHERS,
  DUMMY_SUBJECTS,
  DUMMY_EVENTS,
  DUMMY_ROOMS,
  DUMMY_CLASS_GRADES,
  DUMMY_SCHEDULE,
  DEFAULT_SETTINGS,
  DEFAULT_INSTITUTION_DETAILS,
  DEFAULT_ACADEMIC_CALENDAR,
  DEFAULT_PRINT_SETTINGS,
} from '../constants';

export interface UseTimetableReturn {
  schedule: ScheduleEntry[];
  teachers: Teacher[];
  subjects: Subject[];
  eventActivities: EventActivity[];
  rooms: Room[];
  classGrades: ClassGrade[];
  prefixes: string[];
  departments: string[];
  settings: TimetableSettings;
  institutionDetails: InstitutionDetails;
  academicCalendar: AcademicCalendar;
  printSettings: PrintSettings;
  conflicts: Conflict[];
  addSchedule: (entry: Omit<ScheduleEntry, 'id'>) => void;
  bulkAddScheduleForEvent: (event: EventActivity, day: number, period: number) => void;
  updateSchedule: (entry: ScheduleEntry) => void;
  deleteSchedule: (id: string) => void;
  moveSchedule: (id: string, newDay: number, newPeriod: number) => void;
  findSubject: (id: string) => Subject | undefined;
  findEventActivity: (id: string) => EventActivity | undefined;
  findTeacher: (id: string) => Teacher | undefined;
  findRoom: (id: string) => Room | undefined;
  findClassGrade: (id: string) => ClassGrade | undefined;
  setSettings: (settings: TimetableSettings) => void;
  setInstitutionDetails: (details: InstitutionDetails) => void;
  setAcademicCalendar: (calendar: AcademicCalendar) => void;
  setPrintSettings: (settings: PrintSettings) => void;
  updateMasterData: (type: MasterDataType, data: any[]) => void;
  clearConflicts: () => void;
  getFullState: () => FullTimetableState;
  loadFullState: (state: FullTimetableState) => void;
  clearAllData: () => void;
  connectionStatus: ConnectionStatus;
  retryConnection: () => void;
}

const getFullDefaultState = (): FullTimetableState => ({
    schedule: DUMMY_SCHEDULE,
    teachers: DUMMY_TEACHERS,
    subjects: DUMMY_SUBJECTS,
    eventActivities: DUMMY_EVENTS,
    rooms: DUMMY_ROOMS,
    classGrades: DUMMY_CLASS_GRADES,
    settings: DEFAULT_SETTINGS,
    institutionDetails: DEFAULT_INSTITUTION_DETAILS,
    academicCalendar: DEFAULT_ACADEMIC_CALENDAR,
    printSettings: DEFAULT_PRINT_SETTINGS,
});

const LOCAL_STORAGE_KEY = 'timetableAppState';

const initializeObjectState = <T extends object>(defaultState: T, loadedState: Partial<T> | undefined | null): T => {
  const finalState = { ...defaultState };
  if (loadedState) {
    (Object.keys(defaultState) as Array<keyof T>).forEach(key => {
      const loadedValue = loadedState[key];
      if (loadedValue !== null && loadedValue !== undefined) {
        if (Array.isArray(defaultState[key]) && !Array.isArray(loadedValue)) {
            finalState[key] = defaultState[key];
        } else {
            finalState[key] = loadedValue as T[keyof T];
        }
      }
    });
  }
  return finalState;
};

const loadStateFromStorage = (): FullTimetableState => {
    const defaultState = getFullDefaultState();
    try {
        const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            
            return {
                ...defaultState,
                ...savedState,
                settings: initializeObjectState(defaultState.settings, savedState.settings),
                institutionDetails: initializeObjectState(defaultState.institutionDetails, savedState.institutionDetails),
                academicCalendar: initializeObjectState(defaultState.academicCalendar, savedState.academicCalendar),
                printSettings: initializeObjectState(defaultState.printSettings, savedState.printSettings),
                schedule: Array.isArray(savedState.schedule) ? savedState.schedule : defaultState.schedule,
                teachers: Array.isArray(savedState.teachers) ? savedState.teachers : defaultState.teachers,
                subjects: Array.isArray(savedState.subjects) ? savedState.subjects : defaultState.subjects,
                eventActivities: Array.isArray(savedState.eventActivities) ? savedState.eventActivities : defaultState.eventActivities,
                rooms: Array.isArray(savedState.rooms) ? savedState.rooms : defaultState.rooms,
                classGrades: Array.isArray(savedState.classGrades) ? savedState.classGrades : defaultState.classGrades,
            };
        }
    } catch (e) {
        console.error("Failed to load state from localStorage, using defaults.", e);
    }
    return defaultState;
};


export const useTimetable = (): UseTimetableReturn => {
  const [initialState] = useState(loadStateFromStorage);
  
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialState.schedule);
  const [teachers, setTeachers] = useState<Teacher[]>(initialState.teachers);
  const [subjects, setSubjects] = useState<Subject[]>(initialState.subjects);
  const [eventActivities, setEventActivities] = useState<EventActivity[]>(initialState.eventActivities);
  const [rooms, setRooms] = useState<Room[]>(initialState.rooms);
  const [classGrades, setClassGrades] = useState<ClassGrade[]>(initialState.classGrades);
  const [prefixes] = useState<string[]>(DUMMY_PREFIXES);
  
  const [settings, _setSettings] = useState<TimetableSettings>(initialState.settings);
  const [institutionDetails, _setInstitutionDetails] = useState<InstitutionDetails>(initialState.institutionDetails);
  const [academicCalendar, _setAcademicCalendar] = useState<AcademicCalendar>(initialState.academicCalendar);
  const [printSettings, _setPrintSettings] = useState<PrintSettings>(initialState.printSettings);
  
  const departments = useMemo(() => {
    const allDepartments = teachers.map(teacher => teacher.department).filter(Boolean);
    return [...new Set(allDepartments)].sort();
  }, [teachers]);

  const findSubject = useCallback((id: string) => subjects.find(s => s.id === id), [subjects]);
  const findEventActivity = useCallback((id: string) => eventActivities.find(e => e.id === id), [eventActivities]);
  const findTeacher = useCallback((id: string) => teachers.find(t => t.id === id), [teachers]);
  const findRoom = useCallback((id: string) => rooms.find(r => r.id === id), [rooms]);
  const findClassGrade = useCallback((id: string) => classGrades.find(c => c.id === id), [classGrades]);
  
  const checkForConflicts = useCallback((updatedSchedule: ScheduleEntry[]): Conflict[] => {
    const newConflicts: Conflict[] = [];
    const scheduleMap: { [key: string]: ScheduleEntry[] } = {};

    for (const entry of updatedSchedule) {
        const key = `${entry.day}-${entry.period}`;
        if (!scheduleMap[key]) scheduleMap[key] = [];
        scheduleMap[key].push(entry);
    }

    for (const key in scheduleMap) {
        const entriesInSlot = scheduleMap[key];
        if (entriesInSlot.length > 1) {
            const teacherCounts: { [key: string]: string[] } = {};
            const roomCounts: { [key: string]: string[] } = {};
            const classCounts: { [key: string]: string[] } = {};

            for (const entry of entriesInSlot) {
                if (entry.teacherIds) entry.teacherIds.forEach(teacherId => {
                    if (!teacherCounts[teacherId]) teacherCounts[teacherId] = [];
                    teacherCounts[teacherId].push(entry.id);
                });
                
                if (entry.roomId) {
                  if (!roomCounts[entry.roomId]) roomCounts[entry.roomId] = [];
                  roomCounts[entry.roomId].push(entry.id);
                }
                if (entry.classGradeId) {
                  if (!classCounts[entry.classGradeId]) classCounts[entry.classGradeId] = [];
                  classCounts[entry.classGradeId].push(entry.id);
                }
                if (entry.eventActivityId) {
                  const event = findEventActivity(entry.eventActivityId);
                  if (event) {
                    event.affectedTeacherIds?.forEach(teacherId => {
                      if (!teacherCounts[teacherId]) teacherCounts[teacherId] = [];
                      teacherCounts[teacherId].push(entry.id);
                    });
                  }
                }
            }
            
            Object.entries(teacherCounts).forEach(([teacherId, ids]) => {
                const teacher = findTeacher(teacherId);
                if (ids.length > 1 && teacher) newConflicts.push({ type: 'teacher', message: `Teacher ${teacher.prefix} ${teacher.name} is double-booked.`, involved: ids });
            });
            Object.entries(roomCounts).forEach(([roomId, ids]) => {
                const room = findRoom(roomId);
                if (room) {
                    if (ids.length > (room.capacity || 1)) newConflicts.push({ type: 'room', message: `Room ${room.name} is over capacity (Max: ${room.capacity || 1}, Scheduled: ${ids.length}).`, involved: ids });
                }
            });
            Object.entries(classCounts).forEach(([classId, ids]) => {
                const classGrade = findClassGrade(classId);
                if (ids.length > 1 && classGrade) newConflicts.push({ type: 'class', message: `Class ${classGrade.name} is double-booked.`, involved: ids });
            });
        }
    }
    return newConflicts;
  }, [findEventActivity, findTeacher, findRoom, findClassGrade]);

  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const loadFullState = useCallback((state: FullTimetableState) => {
      setSchedule(state.schedule || []);
      setTeachers(state.teachers || []);
      setSubjects(state.subjects || []);
      setEventActivities(state.eventActivities || []);
      setRooms(state.rooms || []);
      setClassGrades(state.classGrades || []);
      _setSettings(initializeObjectState(DEFAULT_SETTINGS, state.settings));
      _setInstitutionDetails(initializeObjectState(DEFAULT_INSTITUTION_DETAILS, state.institutionDetails));
      _setAcademicCalendar(initializeObjectState(DEFAULT_ACADEMIC_CALENDAR, state.academicCalendar));
      _setPrintSettings(initializeObjectState(DEFAULT_PRINT_SETTINGS, state.printSettings));
      setConflicts(checkForConflicts(state.schedule || []));
  }, [checkForConflicts]);
  
  const { sendAction, connectionStatus, retryConnection } = useTimetableSocket(loadFullState);

  const addSchedule = useCallback((entry: Omit<ScheduleEntry, 'id'>) => {
    const newEntry: ScheduleEntry = { ...entry, id: uuidv4() };
    setSchedule(prev => [...prev, newEntry]);
    sendAction({ type: 'addSchedule', payload: entry });
  }, [sendAction]);

  const bulkAddScheduleForEvent = useCallback((event: EventActivity, day: number, period: number) => {
    const newEntries: ScheduleEntry[] = [];
    if (event.affectedClassGradeIds && event.affectedClassGradeIds.length > 0) {
        event.affectedClassGradeIds.forEach(classId => {
            newEntries.push({ day, period, eventActivityId: event.id, classGradeId: classId, id: uuidv4() });
        });
    } else {
        newEntries.push({ day, period, eventActivityId: event.id, id: uuidv4() });
    }
    setSchedule(prev => [...prev, ...newEntries]);
    sendAction({ type: 'bulkAddScheduleForEvent', payload: { event, day, period } });
  }, [sendAction]);

  const updateSchedule = useCallback((updatedEntry: ScheduleEntry) => {
    setSchedule(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
    sendAction({ type: 'updateSchedule', payload: updatedEntry });
  }, [sendAction]);

  const deleteSchedule = useCallback((id: string) => {
    setSchedule(prev => prev.filter(e => e.id !== id));
    sendAction({ type: 'deleteSchedule', payload: id });
  }, [sendAction]);

  const moveSchedule = useCallback((id: string, newDay: number, newPeriod: number) => {
    setSchedule(prev => prev.map(e => e.id === id ? { ...e, day: newDay, period: newPeriod } : e));
    sendAction({ type: 'moveSchedule', payload: { id, newDay, newPeriod } });
  }, [sendAction]);

  const updateMasterData = useCallback((type: MasterDataType, data: any[]) => {
    const setters: Record<MasterDataType, React.Dispatch<React.SetStateAction<any[]>>> = {
        teachers: setTeachers,
        subjects: setSubjects,
        rooms: setRooms,
        classGrades: setClassGrades,
        eventActivities: setEventActivities,
    };
    const setter = setters[type];
    if (setter) {
        setter(data);
    }
    sendAction({ type: 'updateMasterData', payload: { type, data } });
  }, [sendAction]);

  const setSettings = useCallback((newSettings: TimetableSettings) => {
    _setSettings(newSettings);
    sendAction({ type: 'setSettings', payload: newSettings });
  }, [sendAction]);

  const setInstitutionDetails = useCallback((details: InstitutionDetails) => {
    _setInstitutionDetails(details);
    sendAction({ type: 'setInstitutionDetails', payload: details });
  }, [sendAction]);

  const setAcademicCalendar = useCallback((calendar: AcademicCalendar) => {
    _setAcademicCalendar(calendar);
    sendAction({ type: 'setAcademicCalendar', payload: calendar });
  }, [sendAction]);

  const setPrintSettings = useCallback((settings: PrintSettings) => {
    _setPrintSettings(settings);
    sendAction({ type: 'setPrintSettings', payload: settings });
  }, [sendAction]);

  const getFullState = useCallback((): FullTimetableState => ({
      schedule, teachers, subjects, eventActivities, rooms, classGrades, settings, institutionDetails, academicCalendar, printSettings,
  }), [schedule, teachers, subjects, eventActivities, rooms, classGrades, settings, institutionDetails, academicCalendar, printSettings]);

  const clearAllData = useCallback(() => {
    const defaultState = getFullDefaultState();
    loadFullState(defaultState);
    sendAction({ type: 'clearAllData', payload: null });
  }, [sendAction, loadFullState]);

  const clearConflicts = useCallback(() => setConflicts([]), []);

  useEffect(() => {
    setConflicts(checkForConflicts(schedule));
  }, [schedule, checkForConflicts]);

  useEffect(() => {
    try {
      const stateToSave = getFullState();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [getFullState]);

  return {
    schedule, teachers, subjects, eventActivities, rooms, classGrades, prefixes, departments, settings, institutionDetails, academicCalendar, printSettings,
    conflicts, addSchedule, bulkAddScheduleForEvent, updateSchedule, deleteSchedule, moveSchedule, findSubject, findEventActivity,
    findTeacher, findRoom, findClassGrade, setSettings, setInstitutionDetails, setAcademicCalendar, setPrintSettings,
    updateMasterData, clearConflicts, getFullState, loadFullState, clearAllData,
    connectionStatus,
    retryConnection,
  };
};