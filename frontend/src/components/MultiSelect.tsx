import { Button } from './Button';
import { fieldClassName, fieldLabelClassName } from './Field';

type MultiSelectProps<T extends string> = {
  label: string;
  options: Array<{ id: T; label: string }>;
  selected: T[];
  onChange: (selected: T[]) => void;
};

export function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
}: MultiSelectProps<T>) {
  function toggle(id: T) {
    onChange(
      selected.includes(id)
        ? selected.filter((selectedId) => selectedId !== id)
        : [...selected, id],
    );
  }

  return (
    <div className={fieldClassName}>
      <span className={fieldLabelClassName}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Button
            aria-pressed={selected.includes(option.id)}
            className="min-h-8 px-2.5 aria-pressed:border-brand-600 aria-pressed:bg-brand-100 aria-pressed:text-brand-700"
            key={option.id}
            onClick={() => toggle(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
