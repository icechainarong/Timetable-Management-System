import React, { useState } from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { MasterDataItem, Translator, Teacher, ClassGrade, Subject, EventActivity, Room } from '../types';
import { MasterDataModal } from './MasterDataModal';
import { HIGH_CONTRAST_COLORS } from '../constants';

type ViewType = 'Teachers' | 'Classes' | 'Subjects' | 'Rooms' | 'Events';

const getDataType = (viewType: ViewType): 'teachers' | 'classGrades' | 'subjects' | 'rooms' | 'eventActivities' => {
    switch (viewType) {
        case 'Teachers': return 'teachers';
        case 'Classes': return 'classGrades';
        case 'Subjects': return 'subjects';
        case 'Rooms': return 'rooms';
        case 'Events': return 'eventActivities';
    }
}

const viewTypeToKeyMap: { [key in ViewType]: 'teachers' | 'classes' | 'subjects' | 'rooms' | 'events' } = {
    'Teachers': 'teachers',
    'Classes': 'classes',
    'Subjects': 'subjects',
    'Rooms': 'rooms',
    'Events': 'events',
};

// FIX: Define MasterDataViewProps interface for better type safety and readability.
interface MasterDataViewProps {
  viewType: ViewType;
  timetableState: UseTimetableReturn;
  t: Translator;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ viewType, timetableState, t }) => {
    const dataType = getDataType(viewType);
    const data = timetableState[dataType] || [];
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);

    const openModal = (item: MasterDataItem | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSave = (item: MasterDataItem, scheduleOptions?: { day: number, period: number }) => {
        const isNewItem = !editingItem;
        let updatedData;
        let finalItem = { ...item };

        if ((viewType === 'Subjects' || viewType === 'Events') && isNewItem) {
            // FIX: Cast 'data' to Subject[] to resolve TypeScript error on .some() with union types.
            if (viewType === 'Subjects' && (data as Subject[]).some(d => d.subjectCode === (item as Subject).subjectCode)) {
                alert(t('subjectCodeUnique'));
                return;
            }
            const randomColor = HIGH_CONTRAST_COLORS[Math.floor(Math.random() * HIGH_CONTRAST_COLORS.length)];
            finalItem = { ...finalItem, ...randomColor };
        }
        
        if (isNewItem) {
            updatedData = [...data, finalItem];
        } else {
            updatedData = data.map((d: MasterDataItem) => d.id === editingItem!.id ? finalItem : d);
        }
        timetableState.updateMasterData(dataType, updatedData);

        if (viewType === 'Events' && isNewItem && scheduleOptions) {
            timetableState.bulkAddScheduleForEvent(finalItem as EventActivity, scheduleOptions.day, scheduleOptions.period);
        }

        closeModal();
    };

    const handleDelete = (id: string) => {
        const updatedData = data.filter((d: MasterDataItem) => d.id !== id);
        timetableState.updateMasterData(dataType, updatedData);
        closeModal();
    };

    const columns: string[] = (() => {
        switch(viewType) {
            case 'Teachers': return ['teacherCode', 'prefix', 'name', 'lastName', 'department'];
            case 'Classes': return ['name', 'gradeLevel', 'advisors', 'homeroom'];
            case 'Subjects': return ['subjectCode', 'name', 'gradeLevel'];
            case 'Rooms': return ['name', 'capacity'];
            case 'Events': return ['name', 'affectedTeachers', 'affectedClasses'];
            default: return ['name'];
        }
    })();

    const title = t(viewTypeToKeyMap[viewType]);
    const singularViewType = viewType === 'Classes' ? 'class' : viewType === 'Events' ? 'event' : viewType.slice(0, -1).toLowerCase();

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button onClick={() => openModal()} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                {`${t('addNew')} ${t(singularViewType as any)}`}
            </button>
        </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              {columns.map(col => <th key={col} className={`py-3 px-4 uppercase font-semibold text-sm ${col === 'capacity' ? 'text-center' : 'text-left'}`}>{t(col as any)}</th>)}
              <th className="text-right py-3 px-4 uppercase font-semibold text-sm">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item: MasterDataItem) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                {viewType === 'Teachers' && (
                    <>
                        <td className="py-3 px-4">{(item as Teacher).teacherCode}</td>
                        <td className="py-3 px-4">{(item as Teacher).prefix}</td>
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4">{(item as Teacher).lastName}</td>
                        <td className="py-3 px-4">{(item as Teacher).department}</td>
                    </>
                )}
                {viewType === 'Classes' && (
                    <>
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4">{(item as ClassGrade).gradeLevel}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                            {(((item as ClassGrade).advisorIds || [])
                                .map(id => {
                                    const teacher = timetableState.findTeacher(id);
                                    return teacher ? `${teacher.prefix} ${teacher.name} ${teacher.lastName}` : null;
                                })
                                .filter(Boolean)
                                .join(', ')) || '-'}
                        </td>
                         <td className="py-3 px-4">{timetableState.findRoom((item as ClassGrade).homeroomId || '')?.name || '-'}</td>
                    </>
                )}
                {viewType === 'Subjects' && (
                    <>
                        <td className="py-3 px-4 font-mono text-sm">{(item as Subject).subjectCode}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 text-sm rounded-full ${(item as Subject).color} ${(item as Subject).textColor}`}>
                            {item.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">{(item as Subject).gradeLevel}</td>
                    </>
                )}
                {viewType === 'Events' && (
                     <>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 text-sm rounded-full ${(item as EventActivity).color} ${(item as EventActivity).textColor}`}>
                            {item.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate">
                            {((item as EventActivity).affectedTeacherIds || []).map(id => {
                                const teacher = timetableState.findTeacher(id);
                                return teacher ? `${teacher.name} ${teacher.lastName}` : null;
                            }).filter(Boolean).join(', ') || '-'}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate">
                            {((item as EventActivity).affectedClassGradeIds || []).map(id => timetableState.findClassGrade(id)?.name).filter(Boolean).join(', ') || '-'}
                        </td>
                    </>
                )}
                {viewType === 'Rooms' && (
                    <>
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4 text-center">{(item as Room).capacity}</td>
                    </>
                )}
                <td className="py-3 px-4 text-right">
                    <button onClick={() => openModal(item)} className="text-blue-500 hover:text-blue-700">{t('edit')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MasterDataModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
        item={editingItem}
        viewType={viewType}
        teachers={timetableState.teachers}
        classGrades={timetableState.classGrades}
        rooms={timetableState.rooms}
        settings={timetableState.settings}
        prefixes={timetableState.prefixes}
        departments={timetableState.departments}
        t={t}
      />
    </div>
  );
};