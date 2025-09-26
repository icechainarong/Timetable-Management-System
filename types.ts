import type { translations } from './i18n';

export type Translator = (key: keyof typeof translations.en, vars?: Record<string, string | number>) => string;

export interface MasterDataItem {
  id: string;
  name: string;
  [key: string]: any;
}

export interface Teacher extends MasterDataItem {
  lastName: string;
  prefix: string;
  department: string;
  teacherCode: string;
}

export interface Subject extends MasterDataItem {
  subjectCode: string;
  color: string;
  textColor: string;
  isAcademic: boolean;
  gradeLevel: string;
}

export interface EventActivity extends MasterDataItem {
  color: string;
  textColor: string;
  affectedTeacherIds?: string[];
  affectedClassGradeIds?: string[];
  calculateWorkingHour?: boolean;
}

export interface Room extends MasterDataItem {
  capacity: number;
}

export interface ClassGrade extends MasterDataItem {
  // name would be e.g., 'M.1/1'
  gradeLevel: string; // e.g. 'M.1'
  advisorIds?: string[]; // Array of teacher IDs
  homeroomId?: string; // ID of a room
}

export interface ScheduleEntry {
  id: string;
  day: number; // 0 for Monday, 1 for Tuesday, ...
  period: number; // 0-indexed period
  subjectId?: string;
  teacherIds?: string[];
  roomId?: string;
  classGradeId?: string;
  eventActivityId?: string;
}

export interface TimetableSettings {
  daysPerWeek: number;
  periodsPerDay: number;
  periodTimes: string[];
  minutesPerPeriod: number;
  standardWeeklyHours: number;
  workloadMinHours: number;
  workloadMaxHours: number;
}

export interface Conflict {
  type: 'teacher' | 'room' | 'class';
  message: string;
  involved: string[]; // IDs of schedule entries
}

export interface ActiveView {
  group: string;
  item: string;
}

export interface InstitutionDetails {
  name: string;
  logo: string;
  deputyDirectorName: string;
  schoolDirectorName: string;
  deputyDirectorSignature: string; // base64 string
  schoolDirectorSignature: string; // base64 string
}

export interface Holiday {
    id: string;
    date: string;
    description: string;
}

export interface AcademicCalendar {
    year: string;
    semester: string;
    startDate: string;
    endDate: string;
    holidays: Holiday[];
}

export interface PrintSettings {
    paperSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    marginTop: string;
    marginBottom: string;
    marginLeft: string;
    marginRight: string;
    showLogo: boolean;
    fontFamily: string;
    colorMode: 'color' | 'bw';
}

export interface FullTimetableState {
    schedule: ScheduleEntry[];
    teachers: Teacher[];
    subjects: Subject[];
    eventActivities: EventActivity[];
    rooms: Room[];
    classGrades: ClassGrade[];
    settings: TimetableSettings;
    institutionDetails: InstitutionDetails;
    academicCalendar: AcademicCalendar;
    printSettings: PrintSettings;
}

export type MasterDataType = 'teachers' | 'subjects' | 'rooms' | 'classGrades' | 'eventActivities';

export type UpdateAction = 
  | { type: 'addSchedule'; payload: Omit<ScheduleEntry, 'id'> }
  | { type: 'bulkAddScheduleForEvent'; payload: { event: EventActivity, day: number, period: number } }
  | { type: 'updateSchedule'; payload: ScheduleEntry }
  | { type: 'deleteSchedule'; payload: string }
  | { type: 'moveSchedule'; payload: { id: string; newDay: number; newPeriod: number } }
  | { type: 'updateMasterData'; payload: { type: MasterDataType; data: any[] } }
  | { type: 'setSettings'; payload: TimetableSettings }
  | { type: 'setInstitutionDetails'; payload: InstitutionDetails }
  | { type: 'setAcademicCalendar'; payload: AcademicCalendar }
  | { type: 'setPrintSettings'; payload: PrintSettings }
  | { type: 'clearAllData'; payload: null };
