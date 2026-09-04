"use client";

import { useEffect, useRef, useState } from 'react';

interface StyledSelectOption {
  value: string;
  label: string;
}

interface StyledSelectProps {
  value: string;
  options: StyledSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  isDark: boolean;
  className?: string;
}

export default function StyledSelect({
  value,
  options,
  onChange,
  ariaLabel,
  isDark,
  className = '',
}: StyledSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-10 w-full items-center justify-between gap-3 rounded-xl border px-3 text-left text-[11px] font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
      >
        <span className="truncate">{selectedOption?.label || '選択してください'}</span>
        <svg aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[80] max-h-64 overflow-y-auto rounded-xl border p-1.5 shadow-2xl ring-1 ring-black/5 ${isDark ? 'border-slate-700 bg-slate-900/95 text-slate-200' : 'border-slate-200 bg-white/95 text-slate-700'} backdrop-blur-xl`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[11px] font-mono font-bold transition ${isSelected ? (isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-700') : (isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <span className="ml-3 shrink-0 text-blue-500">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
