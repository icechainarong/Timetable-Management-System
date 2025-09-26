import React, { useState } from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { Translator, FullTimetableState } from '../types';

interface SaveLoadViewProps {
  timetableState: UseTimetableReturn;
  t: Translator;
}

export const SaveLoadView: React.FC<SaveLoadViewProps> = ({ timetableState, t }) => {
    const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleSave = () => {
        try {
            const fullState = timetableState.getFullState();
            const jsonString = JSON.stringify(fullState, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `timetable-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to save data:", error);
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStatus(null);
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("File content is not readable.");
                }
                const data: FullTimetableState = JSON.parse(text);

                // Basic validation
                if (!data.schedule || !data.teachers || !data.settings) {
                    throw new Error("Invalid file format.");
                }

                timetableState.loadFullState(data);
                setStatus({ message: t('loadSuccess'), type: 'success' });
            } catch (error) {
                console.error("Failed to load data:", error);
                setStatus({ message: t('loadError'), type: 'error' });
            } finally {
                // Reset file input value to allow loading the same file again
                if (event.target) {
                    event.target.value = '';
                }
            }
        };

        reader.onerror = () => {
            setStatus({ message: t('loadError'), type: 'error' });
        };

        reader.readAsText(file);
    };
    
    const handleClearData = () => {
        if (window.confirm(t('clearDataConfirmation'))) {
            timetableState.clearAllData();
            setStatus({ message: t('dataClearedSuccess'), type: 'success' });
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">{t('saveLoadData')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Save Section */}
                <div className="border p-6 rounded-lg bg-gray-50 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-3xl text-blue-500">save</span>
                        <h3 className="text-xl font-semibold text-gray-800">{t('saveDataToFile')}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">{t('saveDataDesc')}</p>
                    <button
                        onClick={handleSave}
                        className="w-full bg-blue-500 text-white px-4 py-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                        <span className="material-symbols-outlined">download</span>
                        {t('saveDataToFile')}
                    </button>
                </div>

                {/* Load Section */}
                <div className="border p-6 rounded-lg bg-gray-50 shadow-sm">
                     <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-3xl text-green-500">upload_file</span>
                        <h3 className="text-xl font-semibold text-gray-800">{t('loadDataFromFile')}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{t('loadDataDesc')}</p>
                     <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
                        <p className="font-bold">{t('importWarning')}</p>
                        <p className="text-sm">{t('loadWarning')}</p>
                    </div>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-green-50 file:text-green-700
                            hover:file:bg-green-100 cursor-pointer"
                    />
                </div>
            </div>
             {status && (
                <div className={`mt-6 p-3 rounded-md text-sm ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {status.message}
                </div>
            )}

            {/* Clear Data Section */}
            <div className="mt-8 border-t pt-8 border-red-300">
                <div className="border p-6 rounded-lg bg-red-50 border-red-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-3xl text-red-500">dangerous</span>
                        <h3 className="text-xl font-semibold text-red-800">{t('clearAllDataTitle')}</h3>
                    </div>
                    <p className="text-sm text-red-700 mb-6">{t('clearAllDataDesc')}</p>
                    <button
                        onClick={handleClearData}
                        className="w-full bg-red-600 text-white px-4 py-3 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                        <span className="material-symbols-outlined">delete_forever</span>
                        {t('clearAllDataButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};