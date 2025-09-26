import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TimetableGrid } from './components/TimetableGrid';
import { MasterDataView } from './components/MasterDataView';
import { SettingsPanel } from './components/SettingsPanel';
import { InstitutionSettings } from './components/InstitutionSettings';
import { AcademicCalendar } from './components/AcademicCalendar';
import { ReportView } from './components/ReportView';
import { ExportPrintView } from './components/ExportPrintView';
import { ImportExportView } from './components/ImportExportView';
import { PlaceholderView } from './components/PlaceholderView';
import { ScheduleModal } from './components/ScheduleModal';
import { ConflictNotification } from './components/ConflictNotification';
import { PrintSettingsView } from './components/PrintSettingsView';
import { DynamicPrintStyles } from './components/DynamicPrintStyles';
import { TeacherWorkloadReport } from './components/TeacherWorkloadReport';
import { DashboardView } from './components/DashboardView';
import { useTimetable } from './hooks/useTimetable';
import { useLocalization, translations } from './i18n';
import type { TranslationKey } from './i18n';
import type { ActiveView, ScheduleEntry, Translator } from './types';
import { SaveLoadView } from './components/SaveLoadView';

const App: React.FC = () => {
    const { language, setLanguage, t } = useLocalization();
    const [activeView, setActiveView] = useState<ActiveView>({ group: 'Timetable', item: 'Manual Editor' });
    
    const timetableState = useTimetable();
    const { connectionStatus, retryConnection } = timetableState;
    
    useEffect(() => {
        if (language === 'th') {
            document.body.classList.add('lang-th');
        } else {
            document.body.classList.remove('lang-th');
        }
    }, [language]);

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ day: number, period: number } | null>(null);
    const [prefillData, setPrefillData] = useState<Partial<Omit<ScheduleEntry, 'id' | 'day' | 'period'>> | null>(null);
    
    const handleCellClick = (options: {
        entry?: ScheduleEntry;
        day?: number;
        period?: number;
        prefill?: Partial<Omit<ScheduleEntry, 'id' | 'day' | 'period'>>;
    }) => {
        if (options.entry) {
            setEditingEntry(options.entry);
            setSelectedCell({ day: options.entry.day, period: options.entry.period });
            setPrefillData(null);
        } else if (options.day !== undefined && options.period !== undefined) {
            setEditingEntry(null);
            setSelectedCell({ day: options.day, period: options.period });
            setPrefillData(options.prefill || null);
        }
        setIsScheduleModalOpen(true);
    };

    const closeScheduleModal = () => {
        setIsScheduleModalOpen(false);
        setEditingEntry(null);
        setSelectedCell(null);
        setPrefillData(null);
    };

    const handleSaveSchedule = (entry: ScheduleEntry | Omit<ScheduleEntry, 'id'>) => {
        if ('id' in entry) {
            timetableState.updateSchedule(entry as ScheduleEntry);
        } else {
            timetableState.addSchedule(entry);
        }
        closeScheduleModal();
    };
    
    const handleDeleteSchedule = (id: string) => {
        timetableState.deleteSchedule(id);
        closeScheduleModal();
    };

    const renderActiveView = () => {
        const isThaiSection = activeView.group === 'Reports' || activeView.group === 'Analytics';
        const effectiveLanguage = isThaiSection ? 'th' : language;
        
        const viewT: Translator = (key, vars) => {
            let translation = translations[effectiveLanguage]?.[key] || translations.en[key];

            if (typeof translation !== 'string') {
                console.error(`Translation not found for key: ${key}`);
                return `[${key}]`; // Return key as fallback to prevent crash
            }
            
            if (vars) {
                Object.entries(vars).forEach(([varKey, value]) => {
                    const regex = new RegExp(`\\{${varKey}\\}`, 'g');
                    translation = translation.replace(regex, String(value));
                });
            }
            return translation;
        };

        switch (activeView.item) {
            // Global Settings
            case 'Institution': return <InstitutionSettings timetableState={timetableState} t={viewT} />;
            case 'Academic Calendar': return <AcademicCalendar timetableState={timetableState} t={viewT} />;
            case 'Time Slots': return <SettingsPanel timetableState={timetableState} t={viewT} />;
            // Master Data
            case 'Teachers': return <MasterDataView viewType="Teachers" timetableState={timetableState} t={viewT} />;
            case 'Classes': return <MasterDataView viewType="Classes" timetableState={timetableState} t={viewT} />;
            case 'Subjects': return <MasterDataView viewType="Subjects" timetableState={timetableState} t={viewT} />;
            case 'Rooms': return <MasterDataView viewType="Rooms" timetableState={timetableState} t={viewT} />;
            case 'Events / Activities': return <MasterDataView viewType="Events" timetableState={timetableState} t={viewT} />;
            // Timetable
            case 'Manual Editor': return <TimetableGrid onCellClick={handleCellClick} timetableState={timetableState} t={viewT} />;
            case 'AI Scheduler': return <PlaceholderView title={viewT('aiScheduler')} t={viewT} />;
            case 'Conflicts': return <PlaceholderView title={viewT('conflicts')} description={viewT('conflictReportDesc')} t={viewT} />;
            // Reports
            case 'Student Timetable': return <ReportView viewType="Student Timetable" timetableState={timetableState} t={viewT} />;
            case 'Teacher Timetable': return <ReportView viewType="Teacher Timetable" timetableState={timetableState} t={viewT} />;
            case 'Export / Print': return <ExportPrintView timetableState={timetableState} t={viewT} />;
            case 'Print Setting': return <PrintSettingsView timetableState={timetableState} t={viewT} />;
            // Analytics
            case 'Dashboard': return <DashboardView timetableState={timetableState} t={viewT} />;
            case 'Teacher Workload': return <TeacherWorkloadReport timetableState={timetableState} t={viewT} />;
            case 'Conflict Reports': return <PlaceholderView title={viewT('conflictReports')} t={viewT} />;
            // Advanced
            case 'Import/Export': return <ImportExportView timetableState={timetableState} t={viewT} />;
            case 'Save / Load Data': return <SaveLoadView timetableState={timetableState} t={viewT} />;
            default:
                return <PlaceholderView title={activeView.item} t={viewT} />;
        }
    };

    const renderConnectionStatus = () => {
        if (connectionStatus === 'open') return null;

        const isConnecting = connectionStatus === 'connecting';
        const isOffline = connectionStatus === 'closed';

        let bgColor = isOffline ? 'bg-gray-500' : 'bg-yellow-500';

        return (
            <div className={`fixed bottom-0 left-0 right-0 p-3 text-white text-center text-sm z-50 transition-transform ${bgColor}`}>
                <div className="container mx-auto flex justify-center items-center gap-4">
                    {isConnecting && (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>{t('connectingToServer')}</span>
                        </>
                    )}
                    {isOffline && (
                        <>
                            <span className="material-symbols-outlined">wifi_off</span>
                            <span>{t('connectionError')}</span>
                            <button
                                onClick={retryConnection}
                                className="ml-4 bg-white/20 hover:bg-white/30 text-white font-bold py-1 px-3 rounded text-xs"
                            >
                                {t('retryConnection')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <DynamicPrintStyles settings={timetableState.printSettings} />
            <div className="flex h-screen bg-gray-100 font-sans">
                <Sidebar 
                    activeView={activeView}
                    setActiveView={setActiveView}
                    timetableState={timetableState}
                    language={language}
                    setLanguage={setLanguage}
                    t={t}
                />
                <main className="flex-1 p-6 overflow-auto">
                    {renderActiveView()}
                </main>
                <ScheduleModal 
                    isOpen={isScheduleModalOpen}
                    onClose={closeScheduleModal}
                    onSave={handleSaveSchedule}
                    onDelete={handleDeleteSchedule}
                    scheduleEntry={editingEntry}
                    masterData={timetableState}
                    selectedCell={selectedCell}
                    prefillData={prefillData}
                    t={t}
                />
                <ConflictNotification 
                    conflicts={timetableState.conflicts}
                    onDismiss={timetableState.clearConflicts}
                    t={t}
                />
            </div>
            {renderConnectionStatus()}
        </>
    );
};

export default App;