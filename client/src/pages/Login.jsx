import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, Info, AlertCircle } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import FormInput from '../components/auth/FormInput';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email address is required';
        if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: fieldValue }));

    // Reset notification if user types
    if (submitNotice) setSubmitNotice(null);

    // Validate on change if field was already touched
    if (touched[name] && type !== 'checkbox') {
      const err = validateField(name, fieldValue);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({ email: true, password: true });

    const emailErr = validateField('email', formData.email);
    const passErr = validateField('password', formData.password);

    const newErrors = {
      email: emailErr,
      password: passErr,
    };

    setErrors(newErrors);

    if (emailErr || passErr) {
      return;
    }

    // Client-side validation succeeded!
    setIsSubmitting(true);
    setSubmitNotice(null);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitNotice({
        type: 'info',
        title: 'Backend Authentication Pending',
        message:
          'Client-side validation passed! Backend authentication (MongoDB + JWT) is scheduled for the upcoming implementation step. No credentials were sent or stored.',
      });
    }, 600);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setForgotPasswordNotice(true);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your CodeSync Hub account to access your rooms and collaborate"
    >
      {/* Submission status notice */}
      {submitNotice && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-primary/25 bg-primary/[0.08] p-4 text-xs leading-relaxed text-text transition-all"
        >
          <div className="flex items-start gap-2.5">
            <Info className="h-4 w-4 text-primary-light shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary-light text-xs mb-1">{submitNotice.title}</p>
              <p className="text-text-muted">{submitNotice.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Forgot password placeholder alert */}
      {forgotPasswordNotice && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] p-4 text-xs leading-relaxed text-text transition-all"
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300 text-xs mb-1">Password Recovery</p>
                <p className="text-text-muted">
                  Password reset service is a placeholder and will be enabled once backend mailer services are configured.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForgotPasswordNotice(false)}
              className="text-text-muted hover:text-text text-xs ml-2"
              aria-label="Dismiss note"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormInput
          id="email"
          label="Email address"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="developer@example.com"
          autoComplete="email"
          required
          icon={Mail}
          error={errors.email}
          disabled={isSubmitting}
        />

        <FormInput
          id="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          icon={Lock}
          error={errors.password}
          disabled={isSubmitting}
        />

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-white/[0.12] bg-surface-light text-primary focus:ring-primary/40 focus:ring-offset-0 focus:ring-2 cursor-pointer transition"
            />
            <span className="text-xs text-text-muted hover:text-text transition-colors">
              Remember me
            </span>
          </label>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs font-medium text-primary-light hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-primary/30 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Validating...
              </span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch to signup */}
      <div className="mt-7 pt-6 border-t border-white/[0.06] text-center">
        <p className="text-xs text-text-muted">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-primary-light hover:text-accent transition-colors ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
