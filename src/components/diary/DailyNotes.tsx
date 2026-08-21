import React, { useState } from 'react';
import {
  Cloud,
  CloudRain,
  Coffee,
  Edit3,
  MapPin,
  PartyPopper,
  Save,
  Scale,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { DailyNote } from '../../types';

interface DailyNotesProps {
  date: string;
}

export const DailyNotes: React.FC<DailyNotesProps> = ({ date }) => {
  const { getNoteForDate, saveDailyNote } = useFinance();
  const note = getNoteForDate(date);

  const [isEditing, setIsEditing] = useState(false);
  const [reflectionText, setReflectionText] = useState(note.reflection);
  const [locationText, setLocationText] = useState(note.location || '');

  const moods: { id: DailyNote['mood']; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'peaceful', label: 'Peaceful', icon: <Coffee className="w-3.5 h-3.5" />, color: '#2A6F4E' },
    { id: 'focused', label: 'Focused', icon: <Sparkles className="w-3.5 h-3.5" />, color: '#235789' },
    { id: 'frugal', label: 'Frugal', icon: <Scale className="w-3.5 h-3.5" />, color: '#8C6D37' },
    { id: 'celebratory', label: 'Celebration', icon: <PartyPopper className="w-3.5 h-3.5" />, color: '#C07D2B' },
    { id: 'stressed', label: 'Heavy', icon: <Zap className="w-3.5 h-3.5" />, color: '#B83A3A' },
  ];

  const weathers: { id: 'sunny' | 'rainy' | 'cloudy'; icon: React.ReactNode; label: string }[] = [
    { id: 'sunny', icon: <Sun className="w-3.5 h-3.5" />, label: 'Sunny' },
    { id: 'cloudy', icon: <Cloud className="w-3.5 h-3.5" />, label: 'Cloudy' },
    { id: 'rainy', icon: <CloudRain className="w-3.5 h-3.5" />, label: 'Rainy' },
  ];

  const handleSave = () => {
    saveDailyNote(date, {
      reflection: reflectionText,
      location: locationText,
    });
    setIsEditing(false);
  };

  return (
    <div className="p-4 rounded-xl bg-paper-100/90 dark:bg-paper-dark-card border border-paper-300 dark:border-paper-dark-border shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-paper-300/60 dark:border-paper-dark-border">
        <div className="flex items-center space-x-2">
          <Edit3 className="w-4 h-4 text-archival-brass" />
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-ink-800 dark:text-ink-200">
            Daily Financial Reflection & Margin Notes
          </h4>
        </div>

        {/* Mood & Weather Pills */}
        <div className="flex items-center space-x-2">
          {/* Mood Selector */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            {moods.map(m => {
              const isSelected = note.mood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => saveDailyNote(date, { mood: m.id })}
                  className={`p-2 rounded-md text-[11px] font-sans flex items-center space-x-1 transition-all border min-h-[36px] min-w-[36px] justify-center ${
                    isSelected
                      ? 'bg-paper-50 dark:bg-paper-dark shadow-sm border-paper-400 font-semibold'
                      : 'opacity-50 hover:opacity-90 border-transparent'
                  }`}
                  style={{ color: isSelected ? m.color : undefined }}
                  aria-label={`Mood: ${m.label}`}
                  title={`Mood: ${m.label}`}
                >
                  {m.icon}
                  <span className="hidden sm:inline text-[10px]">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Weather Selector */}
          <div className="h-4 w-px bg-paper-300 dark:bg-paper-dark-border mx-1"></div>

          <div className="flex items-center space-x-1">
            {weathers.map(w => {
              const isSelected = note.weather === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => saveDailyNote(date, { weather: w.id })}
                  className={`p-2 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                    isSelected
                      ? 'bg-paper-200 dark:bg-paper-dark text-ink-900 dark:text-ink-100 shadow-sm'
                      : 'text-ink-400 hover:text-ink-700'
                  }`}
                  aria-label={`Weather: ${w.label}`}
                  title={w.label}
                >
                  {w.icon}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Location Stamp & Note Content */}
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-1 text-xs">
            <MapPin className="w-3.5 h-3.5 text-ink-400" />
            <input
              type="text"
              value={locationText}
              onChange={e => setLocationText(e.target.value)}
              placeholder="Location stamp (e.g. Corner Cafe, Home Studio)"
              className="px-2 py-1 text-xs rounded bg-paper-50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 border border-paper-300 w-full"
            />
          </div>
          <textarea
            value={reflectionText}
            onChange={e => setReflectionText(e.target.value)}
            rows={3}
            placeholder="Write your thoughts about today's spending, intentions, or gratitude..."
            className="w-full p-2.5 rounded-lg bg-paper-50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 font-handwriting text-base border border-paper-300 focus:outline-none focus:ring-1 focus:ring-archival-ochre"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-1 text-xs text-ink-600 rounded hover:bg-paper-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs bg-ink-900 text-paper-50 rounded flex items-center space-x-1"
            >
              <Save className="w-3 h-3" />
              <span>Save Reflection</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => {
            setReflectionText(note.reflection);
            setLocationText(note.location || '');
            setIsEditing(true);
          }}
          className="cursor-pointer group/note rounded-lg p-2 hover:bg-paper-200/40 transition-colors"
        >
          {note.location && (
            <div className="flex items-center space-x-1 text-[11px] font-mono text-ink-500 mb-1">
              <MapPin className="w-3 h-3 text-archival-ochre" />
              <span>{note.location}</span>
            </div>
          )}
          {note.reflection ? (
            <p className="font-handwriting text-base text-ink-800 dark:text-ink-200 leading-relaxed">
              "{note.reflection}"
            </p>
          ) : (
            <p className="font-handwriting text-sm text-ink-400 italic">
              Click to write a handwritten note or reflection for today's page...
            </p>
          )}
        </div>
      )}
    </div>
  );
};
