import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface AppleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: 'green' | 'blue' | 'indigo' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export const AppleSwitch: React.FC<AppleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  color = 'green',
  size = 'md',
  className,
  id,
  'aria-label': ariaLabel,
}) => {
  const colorClasses = {
    green: 'bg-apple-green',
    blue: 'bg-apple-blue',
    indigo: 'bg-apple-indigo',
    orange: 'bg-apple-orange',
  };

  const sizeConfig = {
    sm: {
      track: 'w-9 h-5 p-0.5',
      thumb: 'w-4 h-4',
      translate: 16,
    },
    md: {
      track: 'w-11 h-6 p-0.5',
      thumb: 'w-5 h-5',
      translate: 20,
    },
    lg: {
      track: 'w-13 h-7 p-0.5',
      thumb: 'w-6 h-6',
      translate: 24,
    },
  };

  const cfg = sizeConfig[size];

  return (
    <motion.button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.94 }}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onChange(!checked);
        }
      }}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 cursor-pointer',
        cfg.track,
        checked ? colorClasses[color] : 'bg-black/15 dark:bg-white/20',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      <motion.div
        animate={{ x: checked ? cfg.translate : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={cn(
          'rounded-full bg-white shadow-sm pointer-events-none transform',
          cfg.thumb
        )}
      />
    </motion.button>
  );
};

export default AppleSwitch;
