import React from 'react';
import { Language } from '../types';
import { ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  selected: Language;
  onChange: (lang: Language) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selected, onChange, disabled }) => {
  return (
    <div className="relative inline-block w-full max-w-xs">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value as Language)}
        disabled={disabled}
        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
      >
        {Object.values(Language).map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
        <ChevronDown size={18} />
      </div>
    </div>
  );
};

export default LanguageSelector;
