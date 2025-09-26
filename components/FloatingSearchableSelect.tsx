
import React, { useState, useEffect, useRef } from 'react';
import type { Translator } from '../types';

interface Option {
  id: string;
  name: string;
}

interface FloatingSearchableSelectProps {
    label: string;
    value: string | string[];
    onChange: (newValue: string | string[]) => void;
    options: Option[];
    t: Translator;
    multiple?: boolean;
    disabled?: boolean;
    isRequired?: boolean;
    placeholder?: string;
}

export const FloatingSearchableSelect: React.FC<FloatingSearchableSelectProps> = ({
    label, value, onChange, options, t, multiple = false, disabled = false, isRequired = false, placeholder
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = !multiple ? options.find(opt => opt.id === value) : null;
    const selectedOptions = multiple && Array.isArray(value) ? options.filter(opt => value.includes(opt.id)) : [];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (multiple && Array.isArray(value) ? !value.includes(option.id) : true) // Hide already selected in multi-select
    );

    const handleSelect = (optionId: string) => {
        if (multiple && Array.isArray(value)) {
            const newValue = [...value, optionId];
            onChange(newValue);
        } else {
            onChange(optionId);
            setIsOpen(false);
        }
        setSearchTerm('');
    };

    const handleRemove = (optionId: string) => {
        if (multiple && Array.isArray(value)) {
            const newValue = value.filter(id => id !== optionId);
            onChange(newValue);
        }
    };

    const toggleOpen = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const searchPlaceholder = placeholder || `${t('search')}...`;
    
    return (
        <div ref={wrapperRef} className="relative">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div 
                className={`flex items-center w-full p-1 pl-2 min-h-[42px] border border-gray-300 bg-white rounded-md shadow-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={toggleOpen}
            >
                <div className="flex-grow flex flex-wrap items-center gap-1">
                    {multiple ? (
                        <>
                            {selectedOptions.map(option => (
                                <span key={option.id} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                    {option.name}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleRemove(option.id); }}
                                        className="ml-1 text-blue-600 hover:text-blue-800 leading-none"
                                        aria-label={`Remove ${option.name}`}
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                            {selectedOptions.length === 0 && (
                                <span className="text-gray-500">{placeholder || label}</span>
                            )}
                        </>
                    ) : (
                        <span className={`truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
                            {selectedOption ? selectedOption.name : (placeholder || label)}
                        </span>
                    )}
                </div>
                <span className="material-symbols-outlined text-gray-500 mx-1">
                    {isOpen ? 'expand_less' : 'expand_more'}
                </span>
            </div>
            
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50">
                    <div className="p-2 border-b">
                         <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <li 
                                  key={opt.id} 
                                  onClick={() => handleSelect(opt.id)}
                                  className="p-2 text-sm hover:bg-blue-100 cursor-pointer truncate"
                                >
                                    {opt.name}
                                </li>
                            ))
                        ) : (
                             <li className="p-2 text-sm text-gray-500">{t('noMatchesFound')}</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};
