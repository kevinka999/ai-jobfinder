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
    <div className="field">
      <span>{label}</span>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            aria-pressed={selected.includes(option.id)}
            className="segment"
            key={option.id}
            onClick={() => toggle(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
