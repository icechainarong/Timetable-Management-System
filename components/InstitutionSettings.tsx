import React, { useState, useEffect, useRef } from 'react';
import type { UseTimetableReturn } from '../hooks/useTimetable';
import type { InstitutionDetails, Translator } from '../types';

interface InstitutionSettingsProps {
  timetableState: UseTimetableReturn;
  t: Translator;
}

const InputField = ({ label, name, value, onChange }: { label: string, name: keyof InstitutionDetails, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
    </div>
);

const SignatureUploader = ({ label, signature, onUpload, onRemove, t }: { label: string, signature: string, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, onRemove: () => void, t: Translator }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-2 flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border">
                {signature ? (
                    <img src={signature} alt="Signature Preview" className="h-full w-full object-contain" />
                ) : (
                    <span className="material-symbols-outlined text-4xl text-gray-400">signature</span>
                )}
            </div>
            <div className="flex flex-col gap-2">
                <input
                    type="file"
                    accept="image/*"
                    onChange={onUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {signature && (
                    <button
                        onClick={onRemove}
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm w-fit"
                    >
                        {t('removeSignature')}
                    </button>
                )}
            </div>
        </div>
    </div>
);


export const InstitutionSettings: React.FC<InstitutionSettingsProps> = ({ timetableState, t }) => {
  const [details, setDetails] = useState<InstitutionDetails>(timetableState.institutionDetails);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDetails(timetableState.institutionDetails);
  }, [timetableState.institutionDetails]);

  const handleSave = () => {
    timetableState.setInstitutionDetails(details);
    alert(t('detailsSaved'));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = (field: keyof InstitutionDetails, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setDetails(prev => ({ ...prev, [field]: loadEvent.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = (field: keyof InstitutionDetails, ref?: React.RefObject<HTMLInputElement>) => {
    setDetails(prev => ({ ...prev, [field]: '' }));
    if(ref?.current) {
        ref.current.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('institutionDetails')}</h2>
      <div className="space-y-6">
        <InputField label={t('institutionName')} name="name" value={details.name} onChange={handleInputChange}/>
        
        {/* Logo Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('institutionLogo')}</label>
          <div className="mt-2 flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border">
              {details.logo ? (
                <img src={details.logo} alt="Logo Preview" className="h-full w-full object-contain" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-gray-400">image</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('logo', e)}
                ref={logoInputRef}
                className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 cursor-pointer"
              />
              {details.logo && (
                <button
                  onClick={() => handleRemoveImage('logo', logoInputRef)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm w-fit"
                >
                  {t('removeLogo')}
                </button>
              )}
            </div>
          </div>
        </div>

        <hr />

        {/* Director Names */}
        <InputField label={t('deputyDirectorAcademic')} name="deputyDirectorName" value={details.deputyDirectorName} onChange={handleInputChange} />
        <InputField label={t('schoolDirector')} name="schoolDirectorName" value={details.schoolDirectorName} onChange={handleInputChange} />
        
        {/* Director Signatures */}
        <SignatureUploader
          label={t('deputyDirectorSignature')}
          signature={details.deputyDirectorSignature}
          onUpload={(e) => handleImageUpload('deputyDirectorSignature', e)}
          onRemove={() => handleRemoveImage('deputyDirectorSignature')}
          t={t}
        />
         <SignatureUploader
          label={t('schoolDirectorSignature')}
          signature={details.schoolDirectorSignature}
          onUpload={(e) => handleImageUpload('schoolDirectorSignature', e)}
          onRemove={() => handleRemoveImage('schoolDirectorSignature')}
          t={t}
        />


        <div className="pt-4 flex justify-end">
          <button onClick={handleSave} className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2">
            <span className="material-symbols-outlined">save</span>
            {t('saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
};