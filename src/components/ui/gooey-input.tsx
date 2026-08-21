import React, {
  useState,
  useRef,
  useEffect,
  useId,
  useCallback,
  type ChangeEvent,
} from "react";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface GooeyInputProps {
  placeholder?: string;
  className?: string;
  collapsedWidth?: number;
  expandedWidth?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function GooeyInput({
  placeholder = "Search folio or amount...",
  className,
  collapsedWidth = 110,
  expandedWidth = 220,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onOpenChange,
  onKeyDown,
  disabled = false,
}: GooeyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const isControlled = valueProp !== undefined;
  const searchText = isControlled ? valueProp : uncontrolledValue;

  const setSearchText = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const setExpanded = useCallback(
    (next: boolean) => {
      setIsExpanded(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText],
  );

  const handleBlur = useCallback(() => {
    if (!searchText) {
      setExpanded(false);
    }
  }, [searchText, setExpanded]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSearchText("");
      inputRef.current?.focus();
    },
    [setSearchText],
  );

  return (
    <div className={cn("relative flex items-center", className)}>
      <motion.div
        animate={{
          width: isExpanded || searchText ? expandedWidth : collapsedWidth,
        }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="relative flex items-center h-8 sm:h-9"
      >
        <div
          onClick={() => {
            if (!disabled && !isExpanded) {
              setExpanded(true);
            }
          }}
          className={cn(
            "w-full h-full flex items-center px-2.5 rounded-full transition-colors cursor-pointer border",
            "bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.12]",
            "border-black/[0.06] dark:border-white/[0.1]",
            isExpanded ? "ring-2 ring-apple-blue/50 border-apple-blue" : ""
          )}
        >
          <Search className="w-3.5 h-3.5 text-ink-500 dark:text-ink-400 shrink-0 mr-1.5" />

          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={handleChange}
            onFocus={() => setExpanded(true)}
            onBlur={handleBlur}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder={isExpanded ? placeholder : "Search..."}
            className="w-full bg-transparent text-xs font-sans text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none min-w-0"
          />

          {searchText && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 text-ink-400 dark:text-ink-400 shrink-0 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default GooeyInput;
