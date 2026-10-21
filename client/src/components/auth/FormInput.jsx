import { useState, forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const FormInput = forwardRef(function FormInput(
  {
    id,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    autoComplete,
    required = false,
    helperText,
    icon: Icon,
    disabled = false,
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-medium text-text/90">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      </div>

      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted/50">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          ref={ref}
          id={id}
          name={id}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          className={`w-full rounded-xl bg-surface-light/60 px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/40 border transition-all duration-200 outline-none ${
            Icon ? 'pl-10' : ''
          } ${isPassword ? 'pr-11' : ''} ${
            error
              ? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-white/[0.08] focus:border-primary/80 focus:ring-2 focus:ring-primary/20 hover:border-white/[0.14]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted/60 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg m-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs text-rose-400 font-medium pt-0.5 animate-fadeIn">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="text-xs text-text-muted/60 pt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default FormInput;
