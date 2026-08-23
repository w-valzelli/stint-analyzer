import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

export type CustomSelectOption = {
  value: string;
  label: string;
  detail?: string;
};

type CustomSelectProps = {
  label: string;
  triggerLabel?: string;
  value: string | readonly string[];
  options: readonly CustomSelectOption[];
  multiple?: boolean;
  allOptionValue?: string;
  disabled?: boolean;
  onChange: (value: string | string[]) => void;
};

function controlId(label: string): string {
  return `custom-select-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
}

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function CustomSelect({
  label,
  triggerLabel,
  value,
  options,
  multiple = false,
  allOptionValue,
  disabled = false,
  onChange,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = controlId(label);
  const currentValues = typeof value === 'string' ? [value] : [...value];
  const selectedValues = new Set(currentValues);
  const selectableValues = options
    .filter((option) => option.value !== allOptionValue)
    .map((option) => option.value);
  const allSelected =
    multiple &&
    Boolean(allOptionValue) &&
    selectableValues.length > 0 &&
    selectableValues.every((optionValue) => selectedValues.has(optionValue));
  const displayedLabel =
    triggerLabel ?? options.find((option) => option.value === currentValues[0])?.label ?? '';
  const selectedOptionIndex = Math.max(
    0,
    options.findIndex((option) =>
      option.value === allOptionValue ? allSelected : selectedValues.has(option.value),
    ),
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const bounds = trigger.getBoundingClientRect();
      const margin = 8;
      const gap = 6;
      const viewportWidth = window.innerWidth - margin * 2;
      const width = Math.min(bounds.width, viewportWidth);
      const estimatedHeight = Math.min(options.length * 44 + 10, 320);
      const spaceBelow = window.innerHeight - bounds.bottom - gap - margin;
      const spaceAbove = bounds.top - gap - margin;
      const opensAbove = spaceBelow < Math.min(estimatedHeight, 160) && spaceAbove > spaceBelow;
      const maxHeight = Math.max(72, opensAbove ? spaceAbove : spaceBelow);
      const top = opensAbove
        ? Math.max(margin, bounds.top - gap - Math.min(estimatedHeight, maxHeight))
        : bounds.bottom + gap;
      const left = Math.min(
        Math.max(margin, bounds.left),
        Math.max(margin, window.innerWidth - width - margin),
      );

      setMenuPosition({ top, left, width, maxHeight });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, options.length]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      optionRefs.current[activeIndex]?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, isOpen]);

  const focusOption = (index: number) => {
    if (options.length === 0) {
      return;
    }
    const nextIndex = (index + options.length) % options.length;
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }
    event.preventDefault();
    if (!isOpen) {
      setActiveIndex(selectedOptionIndex);
      setIsOpen(true);
      return;
    }
    focusOption(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
  };

  const handleOptionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(index + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(options.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleOptionClick = (optionValue: string) => {
    if (!multiple) {
      onChange(optionValue);
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    const nextSelected = new Set(selectedValues);
    if (optionValue === allOptionValue) {
      onChange(allSelected ? [] : selectableValues);
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (nextSelected.has(optionValue)) {
      nextSelected.delete(optionValue);
    } else {
      nextSelected.add(optionValue);
    }

    onChange(selectableValues.filter((selectableValue) => nextSelected.has(selectableValue)));
  };

  return (
    <div className="scope-select" ref={rootRef}>
      <button
        type="button"
        className="scope-select__trigger"
        aria-controls={`${id}-menu`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
        ref={triggerRef}
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            triggerRef.current?.focus();
            return;
          }
          setActiveIndex(selectedOptionIndex);
          setIsOpen(true);
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{displayedLabel}</span>
        <ChevronDown aria-hidden="true" size={16} strokeWidth={1.8} />
      </button>

      {isOpen &&
        menuPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id={`${id}-menu`}
            className="scope-select__menu"
            ref={menuRef}
            role="listbox"
            aria-label={`${label} options`}
            aria-multiselectable={multiple || undefined}
            style={menuPosition}
          >
            {options.map((option, index) => {
              const selected =
                option.value === allOptionValue ? allSelected : selectedValues.has(option.value);
              return (
                <button
                  type="button"
                  className="scope-select__option"
                  key={option.value}
                  ref={(optionRef) => {
                    optionRefs.current[index] = optionRef;
                  }}
                  role="option"
                  aria-selected={selected}
                  tabIndex={index === activeIndex ? 0 : -1}
                  onClick={() => handleOptionClick(option.value)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                >
                  <span className="scope-select__option-indicator" aria-hidden="true">
                    {selected && <Check size={14} strokeWidth={2.2} />}
                  </span>
                  <span className="scope-select__option-copy">
                    <strong>{option.label}</strong>
                    {option.detail && <small>{option.detail}</small>}
                  </span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
