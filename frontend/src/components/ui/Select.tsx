import type { SelectHTMLAttributes } from 'react';
import './Select.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  onChange?: (value: string) => void;
}

export const Select = ({
  label,
  options,
  error,
  className = '',
  onChange,
  ...props
}: SelectProps) => {
  return (
    <div className={`mh-input-wrapper ${className}`}>
      {label && <label className="mh-input-label">{label}</label>}
      <select
        className={`mh-select ${error ? 'mh-input-error' : ''}`}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="mh-input-error-msg">{error}</span>}
    </div>
  );
};
