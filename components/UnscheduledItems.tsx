
import React from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { Translator } from '../types';

type DraggableItem = {
    type: 'unscheduled';
    subjectId: string;
    classGradeId: string;
}

interface UnscheduledItemsProps {
    timetableState: UseTimetableReturn;
    t: Translator;
    selectedClassId: string;
}

export const UnscheduledItems: React.FC<UnscheduledItemsProps> = ({ timetableState, t, selectedClassId }) => {
    const { subjects, findClassGrade } = timetableState;

    const selectedClass = findClassGrade(selectedClassId);

    if (!selectedClass) {
        return (
            <div className="mt-8 bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{t('unscheduledClasses')}</h3>
                <p className="text-gray-600">{t('selectClass')} to see unscheduled subjects.</p>
            </div>
        );
    }
    
    const selectedGradeLevel = selectedClass.gradeLevel;

    const filteredSubjects = subjects.filter(subject => {
        if (!subject.gradeLevel || !selectedGradeLevel) {
            return false;
        }
        // Split by comma to handle multiple grades like "M.1, M.2" and perform an exact match on each part.
        // This prevents incorrect partial string matches (e.g., "M.1" in "M.10").
        const subjectGrades = subject.gradeLevel.split(',').map(g => g.trim());
        return subjectGrades.includes(selectedGradeLevel);
    });
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: DraggableItem) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="mt-8 bg-white p-4 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{t('unscheduledClasses')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredSubjects.map(subject => {
                  const item: DraggableItem = { type: 'unscheduled', subjectId: subject.id, classGradeId: selectedClassId };
                  return (
                    <div
                      key={`${subject.id}-${selectedClassId}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      className={`p-3 rounded-lg cursor-grab active:cursor-grabbing flex flex-col ${subject.color} ${subject.textColor} border border-gray-300 hover:ring-2 hover:ring-blue-500 transition-all shadow-sm`}
                    >
                      <span className="font-bold text-sm">{subject.name}</span>
                      <span className="text-xs">{selectedClass.name}</span>
                    </div>
                  )
              })}
              {filteredSubjects.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 py-4">
                      No unscheduled subjects found for grade level "{selectedGradeLevel}".
                  </div>
              )}
            </div>
        </div>
    );
};
