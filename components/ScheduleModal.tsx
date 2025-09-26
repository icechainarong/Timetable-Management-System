import React, { useState, useEffect } from 'react';
import type { ScheduleEntry, Translator, Teacher, Subject } from '../types';
import { Modal } from './Modal';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import { FloatingSearchableSelect } from './FloatingSearchableSelect';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: ScheduleEntry | Omit<ScheduleEntry, 'id'>) => void;
  onDelete: (id: string) => void;
  scheduleEntry: ScheduleEntry | null;
  masterData: UseTimetableReturn;
  selectedCell: { day: number, period: number } | null;
  prefillData: Partial<Omit<ScheduleEntry, 'id' | 'day' | 'period'>> | null;
  t: Translator;
}

const initialFormState = {
  subjectId: '',
  teacherIds: [] as string[],
  roomId: '',
  classGradeId: '',
  eventActivityId: '',
};

type EntryType = 'subject' | 'event';


// Preview Card Component
const ScheduleCardPreview: React.FC<{
  entry: Partial<ScheduleEntry>;
  timetableState: UseTimetableReturn;
  t: Translator;
}> = ({ entry, timetableState, t }) => {
    const { findSubject, findEventActivity, findTeacher, findRoom, findClassGrade } = timetableState;
    const item = entry.subjectId ? findSubject(entry.subjectId) : findEventActivity(entry.eventActivityId || '');

    if (!item) {
        return (
            <div className="p-2 rounded-lg text-xs bg-gray-100 text-gray-500 shadow-inner h-full flex flex-col justify-center text-center">
                <p className="font-bold truncate">{entry.subjectId ? t('selectSubjectPlaceholder') : t('selectEventPlaceholder')}</p>
                <p className="truncate">{t('selectClassPlaceholder')}</p>
                <p className="truncate text-opacity-80">{t('selectRoomPlaceholder')}</p>
            </div>
        );
    }
    const coTeachers = (entry.teacherIds || []).map(id => findTeacher(id)).filter((t): t is Teacher => !!t);
    const teacherNames = coTeachers.map(t => t.name).join(', ');
    const classGrade = entry.classGradeId ? findClassGrade(entry.classGradeId) : null;
    const room = entry.roomId ? findRoom(entry.roomId) : null;
    
    return (
        <div className={`p-2 rounded-lg text-xs ${item.color} ${item.textColor} shadow-md h-full flex flex-col justify-center`}>
            <p className="font-bold truncate">{item.name}</p>
            <p className="truncate">{teacherNames || t('selectTeacherPlaceholder')}</p>
            <p className="truncate">{classGrade?.name || t('selectClassPlaceholder')}</p>
            <p className="truncate text-opacity-80">{room?.name || t('selectRoomPlaceholder')}</p>
        </div>
    );
};


export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen, onClose, onSave, onDelete, scheduleEntry, masterData, selectedCell, prefillData, t
}) => {
  const [formState, setFormState] = useState(initialFormState);
  const [entryType, setEntryType] = useState<EntryType>('subject');
  const { findClassGrade } = masterData;

  useEffect(() => {
    if (isOpen) {
        const isEvent = !!scheduleEntry?.eventActivityId;
        setEntryType(isEvent ? 'event' : 'subject');
        if (scheduleEntry) {
            setFormState({
                subjectId: scheduleEntry.subjectId || '',
                teacherIds: scheduleEntry.teacherIds || [],
                roomId: scheduleEntry.roomId || '',
                classGradeId: scheduleEntry.classGradeId || '',
                eventActivityId: scheduleEntry.eventActivityId || '',
            });
        } else if (prefillData) {
            setFormState({...initialFormState, ...prefillData});
        } else {
            setFormState(initialFormState);
        }
    }
  }, [scheduleEntry, prefillData, isOpen]);

  // Effect to auto-select the homeroom when a class is chosen for a new entry.
  useEffect(() => {
    if (!scheduleEntry && formState.classGradeId && entryType === 'subject') {
      const classInfo = findClassGrade(formState.classGradeId);
      if (classInfo && classInfo.homeroomId) {
        setFormState(prev => ({ ...prev, roomId: classInfo.homeroomId! }));
      }
    }
  }, [formState.classGradeId, scheduleEntry, findClassGrade, entryType]);
  
  const handleChange = (name: string) => (value: string | string[]) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    let payload: Partial<Omit<ScheduleEntry, 'id' | 'day' | 'period'>>;
    if (entryType === 'subject') {
      if (!formState.subjectId || formState.teacherIds.length === 0 || !formState.roomId || !formState.classGradeId) {
        alert(t('fillAllFields'));
        return;
      }
      payload = { subjectId: formState.subjectId, teacherIds: formState.teacherIds, roomId: formState.roomId, classGradeId: formState.classGradeId, eventActivityId: undefined };
    } else {
      if (!formState.eventActivityId) {
        alert(t('fillAllFields'));
        return;
      }
      payload = { subjectId: undefined, teacherIds: formState.teacherIds.length > 0 ? formState.teacherIds : undefined, roomId: formState.roomId || undefined, classGradeId: formState.classGradeId || undefined, eventActivityId: formState.eventActivityId };
    }
    if (scheduleEntry) {
      onSave({ ...scheduleEntry, ...payload });
    } else if (selectedCell) {
      onSave({ ...selectedCell, ...payload });
    }
  };
  
  const handleEntryTypeChange = (type: EntryType) => {
    setEntryType(type);
    setFormState(initialFormState);
  }

  const isClassPrefilledAndLocked = !scheduleEntry && !!prefillData?.classGradeId;
  
  const previewEntry: Partial<ScheduleEntry> = {
    subjectId: entryType === 'subject' ? formState.subjectId : undefined,
    eventActivityId: entryType === 'event' ? formState.eventActivityId : undefined,
    teacherIds: formState.teacherIds,
    roomId: formState.roomId,
    classGradeId: formState.classGradeId,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(scheduleEntry ? 'editSchedule' : 'addSchedule')} size="4xl">
        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-grow space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('entryType')}</label>
                    <div className="flex rounded-md shadow-sm">
                        <button onClick={() => handleEntryTypeChange('subject')} className={`px-4 py-2 text-sm font-medium border ${entryType === 'subject' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-l-md`}>{t('subjectClass')}</button>
                        <button onClick={() => handleEntryTypeChange('event')} className={`px-4 py-2 text-sm font-medium border ${entryType === 'event' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-r-md`}>{t('eventActivity')}</button>
                    </div>
                </div>
                {entryType === 'subject' ? (
                    <>
                        <div className="p-4 border rounded-lg bg-gray-50/50">
                             <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-blue-600">category</span>{t('coreDetails')}</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FloatingSearchableSelect label={t('subjects')} value={formState.subjectId} onChange={handleChange('subjectId')} options={masterData.subjects.map(s => ({ id: s.id, name: `${s.name} (${s.subjectCode})` }))} t={t} isRequired />
                                <FloatingSearchableSelect label={t('classes')} value={formState.classGradeId} onChange={handleChange('classGradeId')} options={masterData.classGrades.map(c => ({ id: c.id, name: c.name }))} t={t} disabled={isClassPrefilledAndLocked} isRequired />
                             </div>
                        </div>
                        <div className="p-4 border rounded-lg bg-gray-50/50">
                            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-blue-600">assignment_ind</span>{t('assignmentDetails')}</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FloatingSearchableSelect label={t('selectTeachers')} value={formState.teacherIds} onChange={handleChange('teacherIds')} options={masterData.teachers.map(t => ({ id: t.id, name: `${t.prefix} ${t.name} ${t.lastName}` }))} t={t} multiple isRequired />
                                <FloatingSearchableSelect label={t('rooms')} value={formState.roomId} onChange={handleChange('roomId')} options={masterData.rooms.map(r => ({ id: r.id, name: r.name }))} t={t} isRequired />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-4 border rounded-lg bg-gray-50/50 space-y-4">
                         <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2"><span className="material-symbols-outlined text-blue-600">celebration</span>{t('eventActivity')}</h3>
                        <FloatingSearchableSelect label={t('eventActivity')} value={formState.eventActivityId} onChange={handleChange('eventActivityId')} options={masterData.eventActivities.map(e => ({ id: e.id, name: e.name }))} t={t} isRequired />
                        <FloatingSearchableSelect label={`${t('classes')} (${t('optional')})`} value={formState.classGradeId} onChange={handleChange('classGradeId')} options={masterData.classGrades.map(c => ({ id: c.id, name: c.name }))} t={t} />
                        <FloatingSearchableSelect label={`${t('selectTeachers')} (${t('optional')})`} value={formState.teacherIds} onChange={handleChange('teacherIds')} options={masterData.teachers.map(t => ({ id: t.id, name: `${t.prefix} ${t.name} ${t.lastName}` }))} t={t} multiple />
                        <FloatingSearchableSelect label={`${t('rooms')} (${t('optional')})`} value={formState.roomId} onChange={handleChange('roomId')} options={masterData.rooms.map(r => ({ id: r.id, name: r.name }))} t={t} />
                    </div>
                )}
            </div>
            <div className="w-full md:w-56 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><span className="material-symbols-outlined">visibility</span>{t('preview')}</h3>
                <div className="bg-white rounded-lg border p-1 aspect-[4/3]">
                    <ScheduleCardPreview entry={previewEntry} timetableState={masterData} t={t} />
                </div>
            </div>
        </div>
        <div className="flex justify-between items-center pt-6 mt-6 border-t">
            <div>{scheduleEntry && (<button onClick={() => onDelete(scheduleEntry.id)} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">{t('delete')}</button>)}</div>
            <div className="flex space-x-2">
                <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">{t('cancel')}</button>
                <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">{t('save')}</button>
            </div>
        </div>
    </Modal>
  );
};