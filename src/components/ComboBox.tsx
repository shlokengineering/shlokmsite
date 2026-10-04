import { useMemo, useRef, useState, type KeyboardEvent } from "react";

interface ComboBoxProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  required?: boolean;
  placeholder?: string;
}

/** Free-text input with case-insensitive substring suggestions from a fixed option list. */
export default function ComboBox({ id, value, onChange, options, required, placeholder }: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return options.slice(0, 8);
    return options.filter((name) => name.toLowerCase().includes(query)).slice(0, 8);
  }, [value, options]);

  function select(name: string) {
    onChange(name);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-autocomplete="list"
        autoComplete="off"
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so a click on a suggestion registers before the list closes.
          setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        placeholder={placeholder}
      />
      {open && suggestions.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg"
        >
          {suggestions.map((name, idx) => (
            <li
              key={name}
              role="option"
              aria-selected={idx === highlight}
              onMouseDown={() => select(name)}
              className={`cursor-pointer px-3 py-2 text-sm ${idx === highlight ? "bg-slate-100" : ""}`}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
