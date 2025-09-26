import React, { useState, useEffect, useMemo } from 'react';
import type { MasterDataItem, Translator, ClassGrade, Teacher, Subject, EventActivity, Room } from '../types';
import { Modal } from './Modal';
import { getDaysOfWeek } from '../i18n';
import { FloatingSearchableSelect } from './FloatingSearchableSelect';

type ViewType = 'Teachers' | 'Classes' | 'Subjects' | 'Rooms' | 'Events';

interface ScheduleOptions {
    day: number;
    period: number;
}
interface MasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MasterDataItem, scheduleOptions?: ScheduleOptions) => void;
  onDelete: (id: string) => void;
  item: MasterDataItem | null;
  viewType: ViewType;
  teachers?: Teacher[];
  classGrades?: ClassGrade[];
  rooms?: Room[];
  settings?: { daysPerWeek: number, periodsPerDay: number };
  prefixes?: string[];
  departments?: string[];
  t: Translator;
}

const generateId = (prefix: string = '') => {
    // Generates a short, reasonably unique ID.
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${Date.now().toString(36).slice(-4).toUpperCase()}${randomPart}`;
};

const getInitialState = (item: MasterDataItem | null, viewType: ViewType) => {
    const isSubject = viewType === 'Subjects';
    const isEvent = viewType === 'Events';

    const generateNewId = () => {
        switch (viewType) {
            case 'Teachers': return generateId('T-');
            case 'Classes': return generateId('C-');
            case 'Events': return generateId('E-');
            case 'Rooms': return generateId('R-');
            case 'Subjects': return generateId('S-');
            default: return generateId();
        }
    };

    const baseState = {
        id: item?.id || generateNewId(),
        name: item?.name || '',
    };

    if (isSubject) {
        const subjectItem = item as (Subject | null);
        return { 
            ...baseState,
            subjectCode: subjectItem?.subjectCode || '',
            gradeLevel: subjectItem?.gradeLevel || '',
            color: subjectItem?.color || '', 
            textColor: subjectItem?.textColor || '',
            isAcademic: subjectItem?.isAcademic === undefined ? true : subjectItem.isAcademic,
        };
    }
    if (viewType === 'Teachers') {
        const teacherItem = item as Teacher | null;
        return { ...baseState, lastName: teacherItem?.lastName || '', prefix: teacherItem?.prefix || '', department: teacherItem?.department || '', teacherCode: teacherItem?.teacherCode || '' };
    }
    if (viewType === 'Classes') {
        const classItem = item as ClassGrade | null;
        return { ...baseState, gradeLevel: classItem?.gradeLevel || '', advisorIds: classItem?.advisorIds || [], homeroomId: classItem?.homeroomId || '' };
    }
    if (viewType === 'Rooms') {
        const roomItem = item as Room | null;
        return { ...baseState, capacity: roomItem?.capacity || 1 };
    }
    if (isEvent) {
        const eventItem = item as (EventActivity | null);
        return { 
            ...baseState, 
            color: eventItem?.color || '', 
            textColor: eventItem?.textColor || '',
            affectedTeacherIds: eventItem?.affectedTeacherIds || [],
            affectedClassGradeIds: eventItem?.affectedClassGradeIds || [],
            calculateWorkingHour: eventItem?.calculateWorkingHour === undefined ? true : eventItem.calculateWorkingHour,
            day: '', // For scheduling
            period: '', // For scheduling
        };
    }
    return baseState;
};

export const MasterDataModal: React.FC<MasterDataModalProps> = ({
  isOpen, onClose, onSave, onDelete, item, viewType, teachers, classGrades, rooms, settings, prefixes, departments, t
}) => {
  const [formState, setFormState] = useState(getInitialState(item, viewType));
  const [selectAllTeachers, setSelectAllTeachers] = useState(false);
  const [selectAllClasses, setSelectAllClasses] = useState(false);
  const DAYS_OF_WEEK = getDaysOfWeek(t);

  const uniqueGradeLevels = useMemo(() => 
    Array.from(new Set(classGrades?.map(c => c.gradeLevel).filter(Boolean) || []))
  , [classGrades]);

  useEffect(() => {
    const initialState = getInitialState(item, viewType);
    setFormState(initialState);
    if (viewType === 'Events') {
        const eventItem = item as EventActivity | null;
        const allTeacherIds = teachers?.map(t => t.id) || [];
        const allClassIds = classGrades?.map(c => c.id) || [];
        
        const areAllTeachersSelected = allTeacherIds.length > 0 && eventItem?.affectedTeacherIds?.length === allTeacherIds.length;
        const areAllClassesSelected = allClassIds.length > 0 && eventItem?.affectedClassGradeIds?.length === allClassIds.length;
        
        setSelectAllTeachers(areAllTeachersSelected);
        setSelectAllClasses(areAllClassesSelected);
    } else {
        setSelectAllTeachers(false);
        setSelectAllClasses(false);
    }
  }, [item, viewType, isOpen, teachers, classGrades]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setFormState({ ...formState, [name]: (e.target as HTMLInputElement).checked });
    } else {
        setFormState({ ...formState, [name]: value });
    }
  };

  const handleFloatingSelectChange = (name: string) => (newValue: string | string[]) => {
      setFormState(prev => ({ ...prev, [name]: newValue }));
  };
  
  const handleSelectAllTeachers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSelectAllTeachers(isChecked);
    handleFloatingSelectChange('affectedTeacherIds')(isChecked ? teachers?.map(t => t.id) || [] : []);
  };
  
  const handleSelectAllClasses = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSelectAllClasses(isChecked);
    handleFloatingSelectChange('affectedClassGradeIds')(isChecked ? classGrades?.map(c => c.id) || [] : []);
  };

  const handleSave = () => {
      if (!formState.name) {
          alert(t('nameIsRequired'));
          return;
      }
      if (viewType === 'Teachers') {
          const teacherState = formState as any;
          if (!teacherState.prefix || !teacherState.lastName || !teacherState.department || !teacherState.teacherCode) {
              alert(t('fillAllFields'));
              return;
          }
      }
      if (viewType === 'Subjects' && !(formState as Subject).subjectCode) {
          alert(t('subjectCodeIsRequired'));
          return;
      }

      let scheduleOptions: ScheduleOptions | undefined = undefined;
      const { day, period, ...restOfState } = formState as any;
      if (viewType === 'Events' && !item && day !== '' && period !== '') {
          scheduleOptions = { day: parseInt(day, 10), period: parseInt(period, 10) };
      }
      
      onSave(restOfState, scheduleOptions);
  };
  
  const singularViewType = viewType === 'Classes' ? 'class' : viewType === 'Events' ? 'event' : viewType.slice(0, -1).toLowerCase();
  const title = t(item ? 'edit' : 'add') + ' ' + t(singularViewType as any);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={viewType === 'Events' ? '2xl' : 'md'}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {viewType !== 'Teachers' && viewType !== 'Subjects' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t(viewType === 'Classes' ? 'class' : viewType === 'Events' ? 'event' : 'room')}</label>
              <input type="text" name="name" id="name" value={formState.name} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
        )}
        
        {viewType === 'Subjects' && (
          <>
            <div>
                <label htmlFor="subjectCode" className="block text-sm font-medium text-gray-700">{t('subjectCode')}</label>
                <input type="text" name="subjectCode" id="subjectCode" value={(formState as any).subjectCode} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
             <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('subjectName')}</label>
              <input type="text" name="name" id="name" value={formState.name} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700">{t('gradeLevel')}</label>
                <input 
                    type="text" 
                    name="gradeLevel" 
                    id="gradeLevel" 
                    value={(formState as any).gradeLevel} 
                    onChange={handleChange} 
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" 
                    placeholder="e.g. M.1 or M.4-M.6"
                    list="grade-levels-list"
                />
                <datalist id="grade-levels-list">
                    {uniqueGradeLevels.map(gl => <option key={gl} value={gl} />)}
                </datalist>
            </div>
            <div className="flex items-center">
                <input type="checkbox" name="isAcademic" id="isAcademic" checked={(formState as any).isAcademic} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <label htmlFor="isAcademic" className="ml-2 block text-sm text-gray-900">{t('isAcademic')}</label>
            </div>
          </>
        )}

        {viewType === 'Teachers' && (
          <>
            <div>
              <label htmlFor="teacherCode" className="block text-sm font-medium text-gray-700">{t('teacherCode')}</label>
              <input type="text" name="teacherCode" id="teacherCode" value={(formState as any).teacherCode} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <FloatingSearchableSelect
                label={t('prefix')}
                value={(formState as any).prefix || ''}
                onChange={handleFloatingSelectChange('prefix')}
                options={prefixes?.map(p => ({ id: p, name: p })) || []}
                t={t}
                placeholder={`${t('select')} ${t('prefix')}`}
            />
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('name')}</label>
              <input type="text" name="name" id="name" value={formState.name} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">{t('lastName')}</label>
              <input type="text" name="lastName" id="lastName" value={(formState as any).lastName} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">{t('department')}</label>
              <input
                type="text"
                name="department"
                id="department"
                value={(formState as any).department || ''}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                list="department-list"
                placeholder={t('department')}
              />
              <datalist id="department-list">
                {departments?.map(d => <option key={d} value={d} />)}
              </datalist>
            </div>
          </>
        )}
        
        {viewType === 'Classes' && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('class')}</label>
                <input type="text" name="name" id="name" value={formState.name} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700">{t('gradeLevel')}</label>
                <input type="text" name="gradeLevel" id="gradeLevel" value={(formState as any).gradeLevel} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
               <FloatingSearchableSelect
                    label={t('advisors')}
                    value={(formState as any).advisorIds || []}
                    onChange={handleFloatingSelectChange('advisorIds')}
                    options={teachers?.map(t => ({ id: t.id, name: `${t.prefix} ${t.name} ${t.lastName}` })) || []}
                    t={t}
                    multiple
                    placeholder={`${t('select')} ${t('advisors')}`}
                />
                <FloatingSearchableSelect
                    label={t('homeroom')}
                    value={(formState as any).homeroomId || ''}
                    onChange={handleFloatingSelectChange('homeroomId')}
                    options={rooms?.map(r => ({ id: r.id, name: r.name })) || []}
                    t={t}
                    placeholder={`${t('select')} ${t('room')}`}
                />
            </>
        )}

        {viewType === 'Rooms' && (
            <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">{t('capacity')}</label>
                <input 
                    type="number" 
                    name="capacity" 
                    id="capacity" 
                    value={(formState as any).capacity} 
                    onChange={handleChange} 
                    min="1" 
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                />
                <p className="text-xs text-gray-500 mt-1">{t('capacityDesc')}</p>
            </div>
        )}

        {viewType === 'Events' && (
            <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('event')}</label>
                  <input type="text" name="name" id="name" value={formState.name} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">{t('affectedTeachers')}</label>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="selectAllTeachers"
                                checked={selectAllTeachers}
                                onChange={handleSelectAllTeachers}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="selectAllTeachers" className="ml-2 block text-sm text-gray-900">{t('affectedTeachersAll')}</label>
                        </div>
                    </div>
                    <FloatingSearchableSelect
                        label=""
                        value={(formState as any).affectedTeacherIds || []}
                        onChange={handleFloatingSelectChange('affectedTeacherIds')}
                        options={teachers?.map(t => ({ id: t.id, name: `${t.prefix} ${t.name} ${t.lastName}` })) || []}
                        t={t}
                        multiple
                        disabled={selectAllTeachers}
                        placeholder={`${t('select')} ${t('teachers')}`}
                    />
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">{t('affectedClasses')}</label>
                         <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="selectAllClasses"
                                checked={selectAllClasses}
                                onChange={handleSelectAllClasses}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="selectAllClasses" className="ml-2 block text-sm text-gray-900">{t('affectedClassesAll')}</label>
                        </div>
                    </div>
                     <FloatingSearchableSelect
                        label=""
                        value={(formState as any).affectedClassGradeIds || []}
                        onChange={handleFloatingSelectChange('affectedClassGradeIds')}
                        options={classGrades?.map(c => ({ id: c.id, name: c.name })) || []}
                        t={t}
                        multiple
                        disabled={selectAllClasses}
                        placeholder={`${t('select')} ${t('classes')}`}
                    />
                </div>
                <div className="flex items-center">
                    <input type="checkbox" name="calculateWorkingHour" id="calculateWorkingHour" checked={(formState as any).calculateWorkingHour} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <label htmlFor="calculateWorkingHour" className="ml-2 block text-sm text-gray-900">{t('calculateWorkingHour')}</label>
                </div>

                {!item && (
                  <div className="p-4 border-t mt-4">
                      <h4 className="text-md font-semibold text-gray-700 mb-2">{t('quickSchedule')} ({t('optional')})</h4>
                      <p className="text-xs text-gray-500 mb-3">{t('quickScheduleDesc')}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="day" className="block text-sm font-medium text-gray-700">{t('day')}</label>
                          <select name="day" id="day" value={(formState as any).day} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm">
                              <option value="">{t('select')} {t('day')}</option>
                              {DAYS_OF_WEEK.slice(0, settings?.daysPerWeek).map((d, i) => <option key={i} value={i}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                           <label htmlFor="period" className="block text-sm font-medium text-gray-700">{t('period')}</label>
                           <select name="period" id="period" value={(formState as any).period} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm">
                              <option value="">{t('select')} {t('period')}</option>
                              {Array.from({length: settings?.periodsPerDay || 0}).map((_, i) => <option key={i} value={i}>{t('period')} {i+1}</option>)}
                           </select>
                        </div>
                      </div>
                  </div>
                )}
            </>
        )}
        </div>
        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div>
            {item && (
              <button onClick={() => onDelete(item.id)} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                {t('delete')}
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
              {t('cancel')}
            </button>
            <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
              {t('save')}
            </button>
          </div>
        </div>
      
    </Modal>
  );
};