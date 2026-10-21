import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import FormInput from '../components/auth/FormInput';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateField = (name, value, allValues = formData) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email address is required';
        if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters long';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== allValues.password) return 'Passwords do not match';
        return '';
      case 'agreeTerms':
        if (!value) return 'You must agree to the Terms of Service';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    const updatedForm = { ...formData, [name]: fieldValue };

    setFormData(updatedForm);

    if (serverError) setServerError('');

    if (touched[name]) {
      const err = validateField(name, fieldValue, updatedForm);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }

    if (name === 'password' && touched.confirmPassword) {
      const confirmErr = validateField('confirmPassword', formData.confirmPassword, updatedForm);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, fieldValue, formData);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    const newErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword, formData),
      agreeTerms: validateField('agreeTerms', formData.agreeTerms),
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      // On successful registration, redirect straight to /dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start collaborating, holding technical interviews, and writing code together"
    >
      {/* Server Error Alert */}
      {serverError && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/[0.08] p-4 text-xs leading-relaxed text-text transition-all animate-fadeIn"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-400 text-xs mb-0.5">Registration Failed</p>
              <p className="text-text-muted">{serverError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormInput
          id="name"
          label="Full name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Ada Lovelace"
          autoComplete="name"
          required
          icon={User}
          error={errors.name}
          disabled={isSubmitting}
        />

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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
          icon={Lock}
          error={errors.password}
          helperText={!errors.password ? 'Must be at least 8 characters long' : undefined}
          disabled={isSubmitting}
        />

        <FormInput
          id="confirmPassword"
          label="Confirm password"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Repeat password"
          autoComplete="new-password"
          required
          icon={Lock}
          error={errors.confirmPassword}
          disabled={isSubmitting}
        />

        {/* Terms and conditions checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.agreeTerms)}
              className="mt-0.5 h-4 w-4 rounded border-white/[0.12] bg-surface-light text-primary focus:ring-primary/40 focus:ring-offset-0 focus:ring-2 cursor-pointer transition"
            />
            <span className="text-xs text-text-muted leading-relaxed">
              I agree to the{' '}
              <span className="text-text hover:underline cursor-pointer">Terms of Service</span> and{' '}
              <span className="text-text hover:underline cursor-pointer">Privacy Policy</span>
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium pt-1.5 pl-6">
              <span>{errors.agreeTerms}</span>
            </p>
          )}
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
                Creating Account...
              </span>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch to login */}
      <div className="mt-7 pt-6 border-t border-white/[0.06] text-center">
        <p className="text-xs text-text-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-light hover:text-accent transition-colors ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
