import { forwardRef, type InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`mh-input-wrapper ${className}`}>
        {label && <label className="mh-input-label">{label}</label>}
        <input
          ref={ref}
          className={`mh-input ${error ? 'mh-input-error' : ''}`}
          {...props}
        />
        {error && <span className="mh-input-error-msg">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
