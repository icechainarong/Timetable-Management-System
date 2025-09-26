import React, { useState } from 'react';
import Papa from 'papaparse';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { Translator, MasterDataItem, Subject } from '../types';
import type { MasterDataType } from '../hooks/useTimetable';
import { HIGH_CONTRAST_COLORS } from '../constants';

// --- START: New Component for Full Data Backup/Restore ---
const FullDataSection: React.FC<{
    onExport: () => void;
    onImport: (file: File) => void;
    status: { message: string; type: 'success' | 'error' } | null;
    t: Translator;
}> = ({ onExport, onImport, status, t }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImport(file);
            // Clear the input so the same file can be selected again
            event.target.value = '';
        }
    };

    return (
        <div className="border-2 border-blue-200 p-6 rounded-lg bg-blue-50 shadow-sm col-span-full mb-8">
            <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-3xl text-blue-600">backup</span>
                <h3 className="text-xl font-semibold text-blue-800">{t('fullMasterData')}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">{t('importAllDesc')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={onExport}
                    className="w-full bg-blue-500 text-white px-4 py-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                    <span className="material-symbols-outlined">download</span>
                    {t('exportAllMasterData')}
                </button>
                <div>
                    <label htmlFor="import-all-json" className="w-full bg-green-500 text-white px-4 py-3 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-semibold cursor-pointer">
                        <span className="material-symbols-outlined">upload</span>
                        {t('importAllMasterData')}
                    </label>
                    <input
                        id="import-all-json"
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            </div>
             {status && (
                <div className={`mt-4 p-3 rounded-md text-sm ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {status.message}
                </div>
            )}
        </div>
    );
};
// --- END: New Component for Full Data Backup/Restore ---


interface DataSectionProps {
  title: string;
  dataType: MasterDataType;
  onExport: (dataType: MasterDataType) => void;
  onImport: (dataType: MasterDataType, file: File) => void;
  onDownloadTemplate: (dataType: MasterDataType) => void;
  status: { message: string; type: 'success' | 'error' } | null;
  t: Translator;
}

const DataSection: React.FC<DataSectionProps> = ({ title, dataType, onExport, onImport, onDownloadTemplate, status, t }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImport(dataType, file);
        }
    };

    return (
        <div className="border p-6 rounded-lg bg-gray-50 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onExport(dataType)}
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">download</span>
                        {t('exportToCsv')}
                    </button>
                     <button
                        onClick={() => onDownloadTemplate(dataType)}
                        className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">description</span>
                        {t('downloadTemplate')}
                    </button>
                </div>
                <div>
                    <h4 className="text-lg font-medium mb-2">{t('importFromCsv')}</h4>
                    <p className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded-md mb-3">{t('importWarning')}</p>
                    <input
                        type="file"
                        accept=".csv,.txt,.tsv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100 cursor-pointer"
                    />
                </div>
                {status && (
                    <div className={`p-3 rounded-md text-sm whitespace-pre-wrap ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
};

const HEADERS: Record<MasterDataType, string[]> = {
    teachers: ['id', 'teacherCode', 'prefix', 'name', 'lastName', 'department'],
    classGrades: ['id', 'name', 'gradeLevel', 'advisorIds', 'homeroomId'],
    subjects: ['id', 'subjectCode', 'name', 'isAcademic', 'gradeLevel', 'color', 'textColor'],
    rooms: ['id', 'name', 'capacity'],
    eventActivities: ['id', 'name', 'affectedTeacherIds', 'affectedClassGradeIds', 'calculateWorkingHour', 'color', 'textColor'],
};

const TEMPLATE_SAMPLES: Record<MasterDataType, any[]> = {
    teachers: [
        { id: 'T-1001', teacherCode: '1001', prefix: 'Mr.', name: 'John', lastName: 'Doe', department: 'Science' },
        { id: 'T-1002', teacherCode: '1002', prefix: 'Ms.', name: 'Jane', lastName: 'Smith', department: 'Mathematics' },
        { id: 'T-1003', teacherCode: '1003', prefix: 'Dr.', name: 'Peter', lastName: 'Jones', department: 'Social Studies' },
        { id: 'T-1004', teacherCode: '1004', prefix: 'Mrs.', name: 'Mary', lastName: 'Williams', department: 'English' },
        { id: 'T-1005', teacherCode: '1005', prefix: 'Mr.', name: 'David', lastName: 'Brown', department: 'Physical Education' },
    ],
    classGrades: [
        { id: 'C-G7A', name: 'Grade 7A', gradeLevel: '7', advisorIds: 'T-1001,T-1002', homeroomId: 'R-101' },
        { id: 'C-G7B', name: 'Grade 7B', gradeLevel: '7', advisorIds: 'T-1003', homeroomId: 'R-102' },
        { id: 'C-G8A', name: 'Grade 8A', gradeLevel: '8', advisorIds: 'T-1004', homeroomId: 'R-201' },
        { id: 'C-G8B', name: 'Grade 8B', gradeLevel: '8', advisorIds: 'T-1005', homeroomId: 'R-202' },
        { id: 'C-G9A', name: 'Grade 9A', gradeLevel: '9', advisorIds: 'T-1001', homeroomId: 'R-301' },
    ],
    subjects: [
        { id: 'S-SCI07', subjectCode: 'SCI-07', name: 'Science 7', isAcademic: 'TRUE', gradeLevel: '7', color: 'bg-green-500', textColor: 'text-white' },
        { id: 'S-MTH07', subjectCode: 'MATH-07', name: 'Math 7', isAcademic: 'TRUE', gradeLevel: '7', color: 'bg-blue-500', textColor: 'text-white' },
        { id: 'S-ENG08', subjectCode: 'ENG-08', name: 'English 8', isAcademic: 'TRUE', gradeLevel: '8', color: 'bg-red-500', textColor: 'text-white' },
        { id: 'S-PE09', subjectCode: 'PE-09', name: 'Physical Education 9', isAcademic: 'FALSE', gradeLevel: '9', color: 'bg-yellow-400', textColor: 'text-black' },
        { id: 'S-ART07', subjectCode: 'ART-07', name: 'Art 7', isAcademic: 'FALSE', gradeLevel: '7,8', color: 'bg-purple-500', textColor: 'text-white' },
    ],
    rooms: [
        { id: 'R-101', name: 'Room 101', capacity: 30 },
        { id: 'R-102', name: 'Room 102', capacity: 30 },
        { id: 'R-LAB1', name: 'Science Lab 1', capacity: 25 },
        { id: 'R-GYM', name: 'Gymnasium', capacity: 100 },
        { id: 'R-AUD', name: 'Auditorium', capacity: 250 },
    ],
    eventActivities: [
        { id: 'E-001', name: 'Assembly', affectedTeacherIds: 'T-1001,T-1002', affectedClassGradeIds: 'C-G7A,C-G7B', calculateWorkingHour: 'FALSE', color: 'bg-gray-400', textColor: 'text-black' },
        { id: 'E-002', name: 'Sports Day Practice', affectedTeacherIds: 'T-1005', affectedClassGradeIds: '', calculateWorkingHour: 'TRUE', color: 'bg-orange-400', textColor: 'text-white' },
        { id: 'E-003', name: 'Club Meeting - Science', affectedTeacherIds: 'T-1001', affectedClassGradeIds: '', calculateWorkingHour: 'FALSE', color: 'bg-green-200', textColor: 'text-black' },
        { id: 'E-004', name: 'Staff Meeting', affectedTeacherIds: 'T-1001,T-1002,T-1003,T-1004,T-1005', affectedClassGradeIds: '', calculateWorkingHour: 'TRUE', color: 'bg-indigo-200', textColor: 'text-black' },
        { id: 'E-005', name: 'Parent-Teacher Conference', affectedTeacherIds: '', affectedClassGradeIds: '', calculateWorkingHour: 'FALSE', color: 'bg-pink-200', textColor: 'text-black' },
    ],
};

export const ImportExportView: React.FC<{ timetableState: UseTimetableReturn; t: Translator; }> = ({ timetableState, t }) => {
    const [importStatuses, setImportStatuses] = useState<Record<MasterDataType, { message: string; type: 'success' | 'error' } | null>>({
        teachers: null,
        subjects: null,
        rooms: null,
        classGrades: null,
        eventActivities: null,
    });
    const [fullImportStatus, setFullImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const setStatus = (dataType: MasterDataType, message: string, type: 'success' | 'error') => {
        setImportStatuses(prev => ({ ...prev, [dataType]: { message, type } }));
    };

    const handleExport = (dataType: MasterDataType) => {
        let dataToExport = [...timetableState[dataType]];
        
        if (dataType === 'classGrades') {
            dataToExport = dataToExport.map((item: any) => ({ ...item, advisorIds: item.advisorIds ? item.advisorIds.join(',') : '' }));
        } else if (dataType === 'eventActivities') {
            dataToExport = dataToExport.map((item: any) => ({ 
                ...item,
                affectedTeacherIds: item.affectedTeacherIds ? item.affectedTeacherIds.join(',') : '',
                affectedClassGradeIds: item.affectedClassGradeIds ? item.affectedClassGradeIds.join(',') : ''
            }));
        }

        const csv = Papa.unparse(dataToExport);
        const BOM = '\uFEFF'; // Add BOM for UTF-8 compatibility with Excel
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${dataType}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadTemplate = (dataType: MasterDataType) => {
        const csv = Papa.unparse({
            fields: HEADERS[dataType],
            data: TEMPLATE_SAMPLES[dataType],
        });

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${dataType}_template.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleExportAll = () => {
        const { teachers, classGrades, subjects, rooms, eventActivities } = timetableState;
        const dataToExport = { teachers, classGrades, subjects, rooms, eventActivities };

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `master-data-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportAll = (file: File) => {
        setFullImportStatus(null);
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not readable.");
                
                const data = JSON.parse(text);
                const requiredKeys: MasterDataType[] = ['teachers', 'classGrades', 'subjects', 'rooms', 'eventActivities'];
                
                for (const key of requiredKeys) {
                    if (!data.hasOwnProperty(key) || !Array.isArray(data[key])) {
                        throw new Error(`Invalid or missing data for '${key}'.`);
                    }
                }

                if (window.confirm(`${t('importAllWarningTitle')}\n\n${t('importAllWarningBody')}`)) {
                    for (const key of requiredKeys) {
                        timetableState.updateMasterData(key, data[key]);
                    }
                    setFullImportStatus({ message: t('importAllSuccess'), type: 'success' });
                }

            } catch (error) {
                console.error("Failed to import all data:", error);
                setFullImportStatus({ message: t('importAllError'), type: 'error' });
            }
        };

        reader.onerror = () => {
            setFullImportStatus({ message: t('importAllError'), type: 'error' });
        };

        reader.readAsText(file);
    };


    const handleImport = (dataType: MasterDataType, file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            complete: (results) => {
                try {
                    const importedData = results.data as any[];

                    if (results.errors.length > 0) {
                        throw new Error("CSV parsing error.");
                    }
                    if (importedData.length === 0) {
                        setStatus(dataType, t('importSuccess', {count: 0}), 'success');
                        return;
                    }

                    const errors: string[] = [];
                    const PREFIX_MAP: Record<MasterDataType, string> = {
                        teachers: 'T-',
                        classGrades: 'C-',
                        rooms: 'R-',
                        eventActivities: 'E-',
                        subjects: 'S-',
                    };
                    
                    const { teachers, rooms, classGrades } = timetableState;
                    const teacherIds = new Set(teachers.map(t => t.id));
                    const roomIds = new Set(rooms.map(r => r.id));
                    const classIds = new Set(classGrades.map(c => c.id));

                    // --- Validation Stage ---
                    importedData.forEach((item, index) => {
                        const rowNum = index + 2; // +1 for 0-index, +1 for header
                        const id = item.id ? String(item.id).trim() : '';
                        
                        if (!id) {
                            errors.push(t('importRowError', { rowNum, errorMsg: t('idMissing') }));
                            return;
                        }

                        const requiredPrefix = PREFIX_MAP[dataType];
                        if (!id.startsWith(requiredPrefix)) {
                            let errorMsgKey: 'teacherIdInvalid' | 'classIdInvalid' | 'roomIdInvalid' | 'eventIdInvalid' | 'subjectIdInvalid' = 'teacherIdInvalid';
                            if (dataType === 'teachers') errorMsgKey = 'teacherIdInvalid';
                            else if (dataType === 'classGrades') errorMsgKey = 'classIdInvalid';
                            else if (dataType === 'rooms') errorMsgKey = 'roomIdInvalid';
                            else if (dataType === 'eventActivities') errorMsgKey = 'eventIdInvalid';
                            else if (dataType === 'subjects') errorMsgKey = 'subjectIdInvalid';
                            errors.push(t('importRowError', { rowNum, errorMsg: t(errorMsgKey) }));
                        }
                        
                        if (dataType === 'classGrades') {
                            if (item.homeroomId && !roomIds.has(item.homeroomId)) {
                                errors.push(t('importRowError', { rowNum, errorMsg: t('roomIdNotFound', { id: item.homeroomId }) }));
                            }
                            if (item.advisorIds) {
                                String(item.advisorIds).split(',').map(id => id.trim()).filter(Boolean).forEach(advId => {
                                    if (!teacherIds.has(advId)) {
                                        errors.push(t('importRowError', { rowNum, errorMsg: t('teacherIdNotFound', { id: advId }) }));
                                    }
                                });
                            }
                        } else if (dataType === 'eventActivities') {
                             if (item.affectedTeacherIds) {
                                String(item.affectedTeacherIds).split(',').map(id => id.trim()).filter(Boolean).forEach(tId => {
                                    if (!teacherIds.has(tId)) {
                                        errors.push(t('importRowError', { rowNum, errorMsg: t('teacherIdNotFound', { id: tId }) }));
                                    }
                                });
                            }
                            if (item.affectedClassGradeIds) {
                                String(item.affectedClassGradeIds).split(',').map(id => id.trim()).filter(Boolean).forEach(cId => {
                                    if (!classIds.has(cId)) {
                                        errors.push(t('importRowError', { rowNum, errorMsg: t('classIdNotFound', { id: cId }) }));
                                    }
                                });
                            }
                        }
                    });

                    if (errors.length > 0) {
                        const fullErrorMsg = `${t('importFailedValidation')}\n${errors.join('\n')}`;
                        setStatus(dataType, fullErrorMsg, 'error');
                        return;
                    }

                    // --- Processing Stage ---
                    const parseBoolean = (val: any, defaultValue: boolean): boolean => {
                        const strVal = String(val).trim().toLowerCase();
                        if (strVal === '') return defaultValue;
                        return !(['false', '0', 'no'].includes(strVal));
                    };
                    const parseArray = (val: any): string[] => val ? String(val).split(',').map((id: string) => id.trim()).filter(Boolean) : [];

                    let processedData = importedData.map(item => {
                        switch (dataType) {
                            case 'rooms':
                                return { ...item, capacity: item.capacity ? parseInt(String(item.capacity), 10) || 1 : 1 };
                            case 'classGrades':
                                return { ...item, advisorIds: parseArray(item.advisorIds) };
                            case 'subjects':
                                const subjectItem: any = { ...item, isAcademic: parseBoolean(item.isAcademic, true) };
                                if (!subjectItem.color || !subjectItem.textColor) {
                                    Object.assign(subjectItem, HIGH_CONTRAST_COLORS[Math.floor(Math.random() * HIGH_CONTRAST_COLORS.length)]);
                                }
                                return subjectItem;
                            case 'eventActivities':
                                const eventItem: any = {
                                    ...item,
                                    affectedTeacherIds: parseArray(item.affectedTeacherIds),
                                    affectedClassGradeIds: parseArray(item.affectedClassGradeIds),
                                    calculateWorkingHour: parseBoolean(item.calculateWorkingHour, true),
                                };
                                if (!eventItem.color || !eventItem.textColor) {
                                    Object.assign(eventItem, HIGH_CONTRAST_COLORS[Math.floor(Math.random() * HIGH_CONTRAST_COLORS.length)]);
                                }
                                return eventItem;
                            default:
                                return item;
                        }
                    });

                    timetableState.updateMasterData(dataType, processedData as MasterDataItem[]);
                    setStatus(dataType, t('importSuccess', {count: processedData.length}), 'success');
                } catch (error) {
                    console.error('Import error:', error);
                    setStatus(dataType, t('importError'), 'error');
                }
            },
            error: (error) => {
                console.error('CSV parsing error:', error);
                setStatus(dataType, t('importError'), 'error');
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">{t('importExportMasterData')}</h2>

            <FullDataSection
                onExport={handleExportAll}
                onImport={handleImportAll}
                status={fullImportStatus}
                t={t}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DataSection title={t('teachersData')} dataType="teachers" onExport={handleExport} onImport={handleImport} onDownloadTemplate={handleDownloadTemplate} status={importStatuses.teachers} t={t} />
                <DataSection title={t('classesData')} dataType="classGrades" onExport={handleExport} onImport={handleImport} onDownloadTemplate={handleDownloadTemplate} status={importStatuses.classGrades} t={t} />
                <DataSection title={t('subjectsData')} dataType="subjects" onExport={handleExport} onImport={handleImport} onDownloadTemplate={handleDownloadTemplate} status={importStatuses.subjects} t={t} />
                <DataSection title={t('roomsData')} dataType="rooms" onExport={handleExport} onImport={handleImport} onDownloadTemplate={handleDownloadTemplate} status={importStatuses.rooms} t={t} />
                <DataSection title={t('eventsData')} dataType="eventActivities" onExport={handleExport} onImport={handleImport} onDownloadTemplate={handleDownloadTemplate} status={importStatuses.eventActivities} t={t} />
            </div>
        </div>
    );
};