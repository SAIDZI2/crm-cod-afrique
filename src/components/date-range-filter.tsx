'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

type Preset = {
  label: string;
  days: number | null; // null = "Tout"
};

const PRESETS: Preset[] = [
  { label: "Aujourd'hui", days: 0 },
  { label: '7 jours', days: 7 },
  { label: '30 jours', days: 30 },
  { label: 'Ce mois', days: -1 }, // special: start of current month
  { label: 'Tout', days: null },
];

function getPresetDates(days: number | null): { start: string; end: string } {
  const end = new Date().toISOString().split('T')[0];
  if (days === null) return { start: '', end: '' };
  if (days === 0) return { start: end, end };
  if (days === -1) {
    // Start of current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    return { start, end };
  }
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return { start: startDate.toISOString().split('T')[0], end };
}

interface DateRangeFilterProps {
  dateDebut: string;
  dateFin: string;
  onDateDebutChange: (value: string) => void;
  onDateFinChange: (value: string) => void;
  className?: string;
}

export function DateRangeFilter({
  dateDebut,
  dateFin,
  onDateDebutChange,
  onDateFinChange,
  className = '',
}: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handlePreset = (preset: Preset) => {
    const { start, end } = getPresetDates(preset.days);
    onDateDebutChange(start);
    onDateFinChange(end);
    setActivePreset(preset.label);
  };

  const handleManualChange = (type: 'start' | 'end', value: string) => {
    setActivePreset(null);
    if (type === 'start') onDateDebutChange(value);
    else onDateFinChange(value);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        <Calendar className="w-4 h-4 text-muted-foreground mt-1.5 mr-1" />
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant={activePreset === preset.label ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => handlePreset(preset)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      {/* Custom date inputs */}
      <div className="flex gap-2 items-center">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Du</span>
        <Input
          type="date"
          value={dateDebut}
          onChange={(e) => handleManualChange('start', e.target.value)}
          className="h-8 text-sm w-[145px]"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">au</span>
        <Input
          type="date"
          value={dateFin}
          onChange={(e) => handleManualChange('end', e.target.value)}
          className="h-8 text-sm w-[145px]"
        />
        {(dateDebut || dateFin) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => {
              onDateDebutChange('');
              onDateFinChange('');
              setActivePreset(null);
            }}
          >
            ✕
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Helper: filter an array of items by date range.
 * Works with any object that has a date field (string ISO format).
 */
export function filterByDateRange<T>(
  items: T[],
  dateField: keyof T,
  dateDebut: string,
  dateFin: string
): T[] {
  return items.filter((item) => {
    const dateValue = String(item[dateField] ?? '');
    if (!dateValue) return true;
    if (dateDebut && dateValue < dateDebut) return false;
    if (dateFin && dateValue > dateFin + 'T23:59:59Z') return false;
    return true;
  });
}
