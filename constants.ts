import type { Teacher, Subject, Room, ClassGrade, ScheduleEntry, TimetableSettings, InstitutionDetails, AcademicCalendar, EventActivity, PrintSettings } from './types';

export const DUMMY_PREFIXES: string[] = [
  'นาย',
  'นาง',
  'นางสาว',
  'mr.',
  'mrs.',
  'ms.',
];

export const DUMMY_DEPARTMENTS: string[] = [
    'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    'กลุ่มสาระการเรียนรู้ภาษาไทย',
    'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม',
    'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
    'กลุ่มสาระการเรียนรู้ศิลปะ',
    'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
    'กลุ่มสาระการเรียนรู้การงานอาชีพ',
];

export const HIGH_CONTRAST_COLORS: { color: string, textColor: string }[] = [
    { color: 'bg-red-500', textColor: 'text-white' },
    { color: 'bg-blue-500', textColor: 'text-white' },
    { color: 'bg-green-500', textColor: 'text-white' },
    { color: 'bg-purple-600', textColor: 'text-white' },
    { color: 'bg-indigo-500', textColor: 'text-white' },
    { color: 'bg-pink-500', textColor: 'text-white' },
    { color: 'bg-yellow-400', textColor: 'text-black' },
    { color: 'bg-teal-500', textColor: 'text-white' },
];

export const DUMMY_TEACHERS: Teacher[] = [
  { id: 'T-101', prefix: 'นาย', name: 'สมชาย', lastName: 'ใจดี', department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี', teacherCode: 'T101' },
  { id: 'T-102', prefix: 'นาง', name: 'สมศรี', lastName: 'มีสุข', department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์', teacherCode: 'T102' },
  { id: 'T-103', prefix: 'นางสาว', name: 'มานี', lastName: 'อดทน', department: 'กลุ่มสาระการเรียนรู้ภาษาไทย', teacherCode: 'T103' },
  { id: 'T-104', prefix: 'นาย', name: 'ปรีดา', lastName: 'รักเรียน', department: 'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม', teacherCode: 'T104' },
];

export const DUMMY_SUBJECTS: Subject[] = [
  { id: 'S-ว21101', subjectCode: 'ว21101', name: 'วิทยาศาสตร์', color: 'bg-green-500', textColor: 'text-white', isAcademic: true, gradeLevel: 'ม.1' },
  { id: 'S-ค21101', subjectCode: 'ค21101', name: 'คณิตศาสตร์', color: 'bg-blue-500', textColor: 'text-white', isAcademic: true, gradeLevel: 'ม.1' },
  { id: 'S-ส21101', subjectCode: 'ส21101', name: 'สังคมศึกษา', color: 'bg-yellow-400', textColor: 'text-black', isAcademic: true, gradeLevel: 'ม.1' },
  { id: 'S-อ21101', subjectCode: 'อ21101', name: 'ภาษาอังกฤษ', color: 'bg-red-500', textColor: 'text-white', isAcademic: true, gradeLevel: 'ม.1' },
  { id: 'S-ท22101', subjectCode: 'ท22101', name: 'ภาษาไทย 3', color: 'bg-pink-500', textColor: 'text-white', isAcademic: true, gradeLevel: 'ม.2' },
  { id: 'S-พ30203', subjectCode: 'พ30203', name: 'ฟิสิกส์ 3', color: 'bg-indigo-500', textColor: 'text-white', isAcademic: true, gradeLevel: 'ม.3' },
  { id: 'S-ก20901', subjectCode: 'ก20901', name: 'ดูแลนักเรียน', color: 'bg-gray-400', textColor: 'text-black', isAcademic: false, gradeLevel: 'ม.1-ม.3' },
];

export const DUMMY_EVENTS: EventActivity[] = [
    { id: 'E-001', name: 'ลูกเสือ/เนตรนารี', color: 'bg-green-200', textColor: 'text-black', affectedTeacherIds: ['T-101', 'T-104'], affectedClassGradeIds: ['C-101', 'C-102'], calculateWorkingHour: true },
    { id: 'E-002', name: 'ชุมนุม', color: 'bg-yellow-200', textColor: 'text-black', affectedClassGradeIds: ['C-201'], calculateWorkingHour: false },
    { id: 'E-003', name: 'คุณธรรม', color: 'bg-pink-200', textColor: 'text-black', affectedClassGradeIds: ['C-101', 'C-102', 'C-201'], calculateWorkingHour: false },
    { id: 'E-004', name: 'สภานักเรียน', color: 'bg-blue-200', textColor: 'text-black', affectedTeacherIds: ['T-103'], calculateWorkingHour: true },
];

export const DUMMY_ROOMS: Room[] = [
  { id: 'R-101', name: 'Room 101', capacity: 1 },
  { id: 'R-102', name: 'Room 102', capacity: 1 },
  { id: 'R-301', name: 'Science Lab', capacity: 1 },
  { id: 'R-501', name: 'Main Hall', capacity: 5 },
];

export const DUMMY_CLASS_GRADES: ClassGrade[] = [
  { id: 'C-101', name: 'ม.1/1', gradeLevel: 'ม.1', advisorIds: ['T-101', 'T-104'], homeroomId: 'R-101' },
  { id: 'C-102', name: 'ม.1/2', gradeLevel: 'ม.1', homeroomId: 'R-102' },
  { id: 'C-201', name: 'ม.2/1', gradeLevel: 'ม.2', advisorIds: ['T-103'] },
];

export const DUMMY_SCHEDULE: ScheduleEntry[] = [
  // Original entries updated for co-teaching feature and new IDs
  { id: 'e1', day: 0, period: 0, subjectId: 'S-ค21101', teacherIds: ['T-102'], roomId: 'R-101', classGradeId: 'C-101' },
  { id: 'e2', day: 0, period: 1, subjectId: 'S-ว21101', teacherIds: ['T-101'], roomId: 'R-301', classGradeId: 'C-101' },
  { id: 'e3', day: 1, period: 2, subjectId: 'S-ส21101', teacherIds: ['T-104'], roomId: 'R-102', classGradeId: 'C-201' },
  // Co-teaching example
  { id: 'e-co', day: 2, period: 0, subjectId: 'S-อ21101', teacherIds: ['T-101', 'T-103'], roomId: 'R-101', classGradeId: 'C-101' },
  // Additional entries for teacher t1
  { id: 'e4', day: 0, period: 2, subjectId: 'S-พ30203', teacherIds: ['T-101'], roomId: 'R-301', classGradeId: 'C-102' },
  { id: 'e5', day: 0, period: 3, subjectId: 'S-พ30203', teacherIds: ['T-101'], roomId: 'R-301', classGradeId: 'C-102' }, // Double period
  { id: 'e6', day: 1, period: 0, subjectId: 'S-ว21101', teacherIds: ['T-101'], roomId: 'R-301', classGradeId: 'C-101' },
  { id: 'e7', day: 1, period: 4, eventActivityId: 'E-001', classGradeId: 'C-101' }, // Activity created by bulk add
  { id: 'e7-clone', day: 1, period: 4, eventActivityId: 'E-001', classGradeId: 'C-102' }, // Activity created by bulk add
  { id: 'e8', day: 2, period: 1, subjectId: 'S-พ30203', teacherIds: ['T-101'], roomId: 'R-301', classGradeId: 'C-102' },
  { id: 'e9', day: 2, period: 2, subjectId: 'S-พ30203', teacherIds: ['T-101'], roomId: 'R-301', classGradeId: 'C-102' }, // Double period
  { id: 'e10', day: 3, period: 5, eventActivityId: 'E-002', classGradeId: 'C-201' }, // Activity
  { id: 'e11', day: 4, period: 0, subjectId: 'S-พ30203', teacherIds: ['T-101'], roomId: 'R-301', classGradeId: 'C-102' },
];

export const DEFAULT_SETTINGS: TimetableSettings = {
  daysPerWeek: 5,
  periodsPerDay: 9,
  periodTimes: [
    '08:30 - 09:20',
    '09:20 - 10:10',
    '10:25 - 11:15',
    '11:15 - 12:05',
    '13:00 - 13:50',
    '13:50 - 14:40',
    '14:50 - 15:40',
    '15:40 - 16:30',
    '16:30 - 17:20',
  ],
  minutesPerPeriod: 50,
  standardWeeklyHours: 35,
  workloadMinHours: 18,
  workloadMaxHours: 25,
};

export const DEFAULT_INSTITUTION_DETAILS: InstitutionDetails = {
    name: "Springfield University",
    logo: "",
    deputyDirectorName: "",
    schoolDirectorName: "",
    deputyDirectorSignature: "",
    schoolDirectorSignature: "",
};

export const DEFAULT_ACADEMIC_CALENDAR: AcademicCalendar = {
    year: "2024-2025",
    semester: "1",
    startDate: "2024-09-01",
    endDate: "2025-06-15",
    holidays: [
        { id: 'h1', date: "2024-12-25", description: "Winter Break" },
        { id: 'h2', date: "2025-04-18", description: "Spring Break" },
    ]
};

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
    paperSize: 'A4',
    orientation: 'landscape',
    marginTop: '1',
    marginBottom: '1',
    marginLeft: '1',
    marginRight: '1',
    showLogo: true,
    fontFamily: 'Sarabun',
    colorMode: 'color',
};

export const AVAILABLE_FONTS = [
    { key: 'Sarabun', nameKey: 'sarabun' },
    { key: 'Sans', nameKey: 'sansSerif' },
] as const;