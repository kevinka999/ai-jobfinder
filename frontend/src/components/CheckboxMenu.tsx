import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cx } from '../lib/classNames';
import { fieldClassName, fieldLabelClassName, inputClassName } from './Field';

export type CheckboxMenuOption<T extends string> = {
  id: T;
  label: string;
};

type CheckboxMenuProps<T extends string> = {
  emptyLabel?: string;
  label: string;
  menuLabel: string;
  onChange: (selected: T[]) => void;
  options: Array<CheckboxMenuOption<T>>;
  selected: T[];
  selectedLabel?: (
    selected: T[],
    options: Array<CheckboxMenuOption<T>>,
  ) => string;
};

export function CheckboxMenu<T extends string>({
  emptyLabel = 'All',
  label,
  menuLabel,
  onChange,
  options,
  selected,
  selectedLabel = getDefaultSelectedLabel,
}: CheckboxMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function toggle(id: T) {
    onChange(
      selected.includes(id)
        ? selected.filter((selectedId) => selectedId !== id)
        : [...selected, id],
    );
  }

  return (
    <div className={fieldClassName} ref={menuRef}>
      <span className={fieldLabelClassName}>{label}</span>
      <div className="relative">
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className={cx(
            inputClassName,
            'flex items-center justify-between gap-inline text-left',
          )}
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          <span className="truncate">
            {selected.length === 0
              ? emptyLabel
              : selectedLabel(selected, options)}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cx(
              'shrink-0 text-app-text-muted transition-transform',
              isOpen && 'rotate-180',
            )}
            size={15}
          />
        </button>
        {isOpen ? (
          <div
            aria-label={menuLabel}
            className="absolute z-30 mt-1 grid w-full min-w-56 gap-1 rounded-panel border border-app-border bg-app-surface p-1.5 shadow-drawer"
            role="menu"
          >
            {options.map((option) => (
              <label
                className="flex min-h-8 cursor-pointer items-center gap-inline rounded-control px-2 text-sm text-app-text hover:bg-app-surface-muted"
                key={option.id}
              >
                <input
                  checked={selected.includes(option.id)}
                  className="size-4 accent-brand-600"
                  onChange={() => toggle(option.id)}
                  type="checkbox"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getDefaultSelectedLabel<T extends string>(
  selected: T[],
  options: Array<CheckboxMenuOption<T>>,
): string {
  if (selected.length === 1) {
    return (
      options.find((option) => option.id === selected[0])?.label ?? selected[0]
    );
  }

  return `${selected.length} selected`;
}
