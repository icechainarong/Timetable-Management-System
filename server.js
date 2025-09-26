/**
 * Smart Timetable Management System - WebSocket Server
 * 
 * This Node.js server acts as the central authority for the timetable state.
 * It uses WebSockets to communicate with clients in real-time.
 * 
 * To run this server:
 * 1. Make sure you have Node.js installed.
 * 2. In your project directory, run: npm init -y
 * 3. Install dependencies: npm install ws uuid
 * 4. Run the server: node server.js
 */

// 1. Imports
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

// 2. Constants and Configuration
const PORT = 8080;
const DB_PATH = path.join(__dirname, 'database.json');
const SAVE_INTERVAL = 15000; // Save state to file every 15 seconds

// 3. Initial Default State (derived from frontend constants)
const DUMMY_TEACHERS = [
  { id: 'T-101', prefix: 'นาย', name: 'สมชาย', lastName: 'ใจดี', department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี', teacherCode: 'T101' },
  { id: 'T-102', prefix: 'นาง', name: 'สมศรี', lastName: 'มีสุข', department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์', teacherCode: 'T102' },
];
const DUMMY_SUBJECTS = [
  { id: 'S-ว21101', subjectCode: 'ว21101', name: 'วิทยาศาสตร์', color: 'bg-green-500', textColor: 'text-white', isAcademic: true, gradeLevel: 'ม.1' },
  { id: 'S-ค21101', subjectCode: 'ค21101', name: 'คณิตศาสตร์', color: 'bg-blue-500', textColor: 'text-white', isAcademic: true, gradeLevel: 'ม.1' },
];
const DUMMY_EVENTS = [
    { id: 'E-001', name: 'ลูกเสือ/เนตรนารี', color: 'bg-green-200', textColor: 'text-black', affectedTeacherIds: ['T-101'], affectedClassGradeIds: ['C-101'], calculateWorkingHour: true },
];
const DUMMY_ROOMS = [
  { id: 'R-101', name: 'Room 101', capacity: 1 },
  { id: 'R-102', name: 'Room 102', capacity: 1 },
];
const DUMMY_CLASS_GRADES = [
  { id: 'C-101', name: 'ม.1/1', gradeLevel: 'ม.1', advisorIds: ['T-101'], homeroomId: 'R-101' },
  { id: 'C-102', name: 'ม.1/2', gradeLevel: 'ม.1', homeroomId: 'R-102' },
];
const DUMMY_SCHEDULE = [
  { id: 'e1', day: 0, period: 0, subjectId: 'S-ค21101', teacherIds: ['T-102'], roomId: 'R-101', classGradeId: 'C-101' },
  { id: 'e2', day: 0, period: 1, subjectId: 'S-ว21101', teacherIds: ['T-101'], roomId: 'R-101', classGradeId: 'C-101' },
];
const DEFAULT_SETTINGS = {
  daysPerWeek: 5, periodsPerDay: 9, periodTimes: ['08:30 - 09:20', '09:20 - 10:10', '10:25 - 11:15', '11:15 - 12:05', '13:00 - 13:50', '13:50 - 14:40', '14:50 - 15:40', '15:40 - 16:30', '16:30 - 17:20'], minutesPerPeriod: 50, standardWeeklyHours: 35, workloadMinHours: 18, workloadMaxHours: 25
};
const DEFAULT_INSTITUTION_DETAILS = { name: "Springfield University", logo: "", deputyDirectorName: "", schoolDirectorName: "", deputyDirectorSignature: "", schoolDirectorSignature: "" };
const DEFAULT_ACADEMIC_CALENDAR = { year: "2024-2025", semester: "1", startDate: "2024-09-01", endDate: "2025-06-15", holidays: [{ id: 'h1', date: "2024-12-25", description: "Winter Break" }] };
const DEFAULT_PRINT_SETTINGS = { paperSize: 'A4', orientation: 'landscape', marginTop: '1', marginBottom: '1', marginLeft: '1', marginRight: '1', showLogo: true, fontFamily: 'Sarabun', colorMode: 'color' };

const getInitialState = () => ({
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


// 4. State Management and Persistence
let state;

const loadState = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            console.log(`Loading state from ${DB_PATH}...`);
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            const parsedData = JSON.parse(data);
            const defaults = getInitialState();

            if (parsedData && parsedData.settings) {
                // Create a new state object by merging defaults with parsed data
                const mergedState = { ...defaults, ...parsedData };
                
                // Deep merge for nested objects to ensure all keys from defaults are present
                mergedState.settings = { ...defaults.settings, ...(parsedData.settings || {}) };
                mergedState.institutionDetails = { ...defaults.institutionDetails, ...(parsedData.institutionDetails || {}) };
                mergedState.academicCalendar = { ...defaults.academicCalendar, ...(parsedData.academicCalendar || {}) };
                mergedState.printSettings = { ...defaults.printSettings, ...(parsedData.printSettings || {}) };

                // Ensure arrays are arrays, falling back to default if loaded data is invalid
                Object.keys(defaults).forEach(key => {
                    if (Array.isArray(defaults[key]) && !Array.isArray(mergedState[key])) {
                        mergedState[key] = defaults[key];
                    }
                });

                return mergedState;
            }
        }
    } catch (error) {
        console.error(`Could not load or parse state from ${DB_PATH}:`, error);
    }
    console.log('No valid database found. Initializing with default state.');
    return getInitialState();
};

const saveState = () => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
        // console.log(`State saved to ${DB_PATH}`); // Muted for less console noise
    } catch (error) {
        console.error('Error saving state:', error);
    }
};

// Initialize state from file or defaults
state = loadState();

// Set up periodic saving
setInterval(saveState, SAVE_INTERVAL);


// 5. WebSocket Server Setup
const wss = new WebSocketServer({ port: PORT });
const clients = new Set();
console.log(`✅ WebSocket server started on ws://localhost:${PORT}`);


// 6. Action Handler (mutates the server's in-memory state)
const handleAction = (action) => {
    console.log(`Processing action: ${action.type}`);
    switch (action.type) {
        case 'addSchedule':
            state.schedule.push({ ...action.payload, id: uuidv4() });
            break;
        case 'bulkAddScheduleForEvent': {
            const { event, day, period } = action.payload;
            if (event.affectedClassGradeIds && event.affectedClassGradeIds.length > 0) {
                event.affectedClassGradeIds.forEach(classId => {
                    state.schedule.push({ day, period, eventActivityId: event.id, classGradeId: classId, id: uuidv4() });
                });
            } else {
                state.schedule.push({ day, period, eventActivityId: event.id, id: uuidv4() });
            }
            break;
        }
        case 'updateSchedule':
            state.schedule = state.schedule.map(e => e.id === action.payload.id ? action.payload : e);
            break;
        case 'deleteSchedule':
            state.schedule = state.schedule.filter(e => e.id !== action.payload);
            break;
        case 'moveSchedule':
            state.schedule = state.schedule.map(e => e.id === action.payload.id ? { ...e, day: action.payload.newDay, period: action.payload.newPeriod } : e);
            break;
        case 'updateMasterData': {
            const { type, data } = action.payload;
            // Ensure the type is a valid key on our state object to prevent errors
            if (Object.keys(state).includes(type)) {
                state[type] = data;
            } else {
                console.warn(`Attempted to update invalid master data type: ${type}`);
            }
            break;
        }
        case 'setSettings':
            state.settings = { ...state.settings, ...action.payload };
            break;
        case 'setInstitutionDetails':
            state.institutionDetails = { ...state.institutionDetails, ...action.payload };
            break;
        case 'setAcademicCalendar':
            state.academicCalendar = { ...state.academicCalendar, ...action.payload };
            break;
        case 'setPrintSettings':
            state.printSettings = { ...state.printSettings, ...action.payload };
            break;
        case 'clearAllData':
            state = getInitialState();
            break;
        default:
            console.warn(`Unknown action type received: ${action.type}`);
    }
};

// 7. Broadcasting function
const broadcastState = () => {
    const stateString = JSON.stringify(state);
    clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(stateString);
        }
    });
    console.log(`State broadcasted to ${clients.size} client(s).`);
};


// 8. Connection Handling
wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    // Immediately send the full, current state to the newly connected client
    ws.send(JSON.stringify(state));

    ws.on('message', (message) => {
        try {
            const action = JSON.parse(message.toString());
            handleAction(action); // Update server state based on client action
            broadcastState();     // Broadcast the new state to ALL clients
        } catch (error) {
            console.error('Failed to process message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// 9. Graceful Shutdown
process.on('SIGINT', () => {
    console.log('\nServer shutting down. Saving final state...');
    saveState();
    wss.close(() => {
        console.log('WebSocket server closed.');
        process.exit(0);
    });
});
