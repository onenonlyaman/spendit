import React, { useState } from 'react';
import { motion } from 'motion/react';
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

  const moods: { id: DailyNote['mood']; label: string; icon: React.ReactNode; colorClass: string; activeClass: string }[] = [
    { id: 'peaceful', label: 'Peaceful', icon: <Coffee className="w-3.5 h-3.5" />, colorClass: 'text-apple-green', activeClass: 'bg-apple-green/15 text-apple-green border-apple-green/30 font-bold' },
    { id: 'focused', label: 'Focused', icon: <Sparkles className="w-3.5 h-3.5" />, colorClass: 'text-accent', activeClass: 'bg-apple-blue/15 text-accent border-apple-blue/30 font-bold' },
    { id: 'frugal', label: 'Frugal', icon: <Scale className="w-3.5 h-3.5" />, colorClass: 'text-apple-purple', activeClass: 'bg-apple-purple/15 text-apple-purple border-apple-purple/30 font-bold' },
    { id: 'celebratory', label: 'Celebration', icon: <PartyPopper className="w-3.5 h-3.5" />, colorClass: 'text-apple-orange', activeClass: 'bg-apple-orange/15 text-apple-orange border-apple-orange/30 font-bold' },
    { id: 'stressed', label: 'Heavy', icon: <Zap className="w-3.5 h-3.5" />, colorClass: 'text-apple-red', activeClass: 'bg-apple-red/15 text-apple-red border-apple-red/30 font-bold' },
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
    <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center space-x-2">
          <Edit3 className="w-4 h-4 text-apple-orange" />
          <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-ink-900 dark:text-ink-100">
            Daily Financial Reflection & Margin Notes
          </h4>
        </div>

        {/* Mood & Weather Pills */}
        <div className="flex items-center space-x-2">
          {/* Mood Selector with Edge Fade Affordance */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar scroll-fade-x mask-fade-x sm:mask-none px-1">
            {moods.map(m => {
              const isSelected = note.mood === m.id;
              return (
                <motion.button
                  key={m.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => saveDailyNote(date, { mood: m.id })}
                  className={`px-2.5 py-1 rounded-full text-xs font-sans flex items-center space-x-1 transition-all border ${
                    isSelected
                      ? m.activeClass
                      : 'bg-black/5 dark:bg-white/10 text-secondary border-transparent hover:bg-black/10'
                  }`}
                  aria-label={`Mood: ${m.label}`}
                  title={`Mood: ${m.label}`}
                >
                  {m.icon}
                  <span className="hidden sm:inline text-xs">{m.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Weather Selector */}
          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1"></div>

          <div className="flex items-center space-x-1">
            {weathers.map(w => {
              const isSelected = note.weather === w.id;
              return (
                <motion.button
                  key={w.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => saveDailyNote(date, { weather: w.id })}
                  className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${
                    isSelected
                      ? 'bg-apple-blue/15 text-accent font-bold shadow-sm'
                      : 'text-secondary hover:text-ink-700 dark:hover:text-ink-200'
                  }`}
                  aria-label={`Weather: ${w.label}`}
                  title={w.label}
                >
                  {w.icon}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Location Stamp & Note Content */}
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-secondary" />
            <input
              type="text"
              value={locationText}
              onChange={e => setLocationText(e.target.value)}
              placeholder="Location stamp (e.g. Corner Cafe, Home Studio)"
              className="px-3 py-1.5 text-xs rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 border border-black/10 dark:border-white/10 w-full focus-ring"
            />
          </div>
          <textarea
            value={reflectionText}
            onChange={e => setReflectionText(e.target.value)}
            rows={3}
            placeholder="Write your thoughts about today's spending, intentions, or gratitude..."
            className="w-full p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-ink-900 dark:text-ink-100 font-sans text-xs border border-black/10 dark:border-white/10 focus-ring leading-relaxed"
          />
          <div className="flex justify-end space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs font-semibold text-secondary rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
            >
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold bg-accent text-white rounded-xl flex items-center space-x-1 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Reflection</span>
            </motion.button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => {
            setReflectionText(note.reflection);
            setLocationText(note.location || '');
            setIsEditing(true);
          }}
          className="cursor-pointer group/note rounded-xl p-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
        >
          {note.location && (
            <div className="flex items-center space-x-1 text-xs text-secondary mb-1">
              <MapPin className="w-3 h-3 text-apple-orange" />
              <span>{note.location}</span>
            </div>
          )}
          {note.reflection ? (
            <p className="text-xs font-sans text-ink-800 dark:text-ink-200 leading-relaxed italic">
 "{note.reflection}"
            </p>
          ) : (
            <p className="text-xs text-secondary italic">
              Click to write a note or reflection for today's page...
            </p>
          )}
        </div>
      )}
    </div>
  );
};
