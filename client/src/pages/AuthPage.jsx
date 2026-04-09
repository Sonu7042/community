import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getRandomAvatar } from '../data/avatarOptions';

const API_BASE_URL = 'http://localhost:3000/api/auth';
const AUTH_STORAGE_KEY = 'mycommunityUser';

const authModes = {
  login: {
    title: 'Login',
    subtitle: 'Access your MyCommunity account.',
    buttonLabel: 'Login',
    helperText: "Don't have an account?",
    switchLabel: 'Create account',
    switchTo: 'signup',
  },
  signup: {
    title: 'Create account',
    subtitle: 'Join your project community with a simple account.',
    buttonLabel: 'Sign up',
    helperText: 'Already have an account?',
    switchLabel: 'Login',
    switchTo: 'login',
  },
};

const initialFormState = {
  username: '',
  email: '',
  password: '',
};

const getResponseMessage = (data) => {
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.join(', ');
  }

  return data?.message || 'Something went wrong. Please try again.';
};

function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const modeContent = authModes[currentMode];

  const [formData, setFormData] = useState(initialFormState);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);

    if (savedUser) {
      navigate('/');
    }
  }, [navigate]);

  const clearFeedback = () => {
    setMessage('');
    setError('');
  };

  const switchMode = (mode) => {
    setSearchParams({ mode });
    setFormData(initialFormState);
    setVerificationCode('');
    setVerificationEmail('');
    setShowVerificationStep(false);
    clearFeedback();
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const postRequest = async (endpoint, payload) => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getResponseMessage(data));
    }

    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    clearFeedback();

    try {
      const data = await postRequest(
        currentMode === 'signup' ? 'signup' : 'login',
        currentMode === 'signup'
          ? {
              username: formData.username,
              email: formData.email,
              password: formData.password,
            }
          : {
              email: formData.email,
              password: formData.password,
            }
      );

      if (currentMode === 'signup') {
        setVerificationEmail(formData.email.trim().toLowerCase());
        setVerificationCode('');
        setShowVerificationStep(true);
        setMessage(data.message || 'Verification code sent to your email.');
      } else {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            ...data.user,
            avatar: data.user.avatar || getRandomAvatar(),
          })
        );
        setMessage(data.message || 'Login successful');
        setTimeout(() => {
          navigate('/');
        }, 800);
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    clearFeedback();

    try {
      await postRequest('verify-email', {
        email: verificationEmail,
        code: verificationCode,
      });

      setShowVerificationStep(false);
      setFormData({
        username: '',
        email: verificationEmail,
        password: '',
      });
      setSearchParams({ mode: 'login' });
      setMessage('Email verified successfully. You can login now.');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsSubmitting(true);
    clearFeedback();

    try {
      const data = await postRequest('resend-verification-code', {
        email: verificationEmail,
      });

      setMessage(data.message || 'Verification code sent successfully');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-noise px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-stroke bg-panel px-4 py-2 text-sm text-textSoft transition hover:text-white"
        >
          <span>&larr;</span>
          Back to home
        </Link>

        <section className="rounded-[28px] border border-stroke bg-panel p-5 shadow-panel sm:p-8">
          <div className="mb-6">
            <h1 className="text-center text-3xl font-semibold text-white">
              {showVerificationStep ? 'Verify email' : modeContent.title}
            </h1>
            <p className="mt-2 text-sm text-textSoft">
              {showVerificationStep
                ? `Enter the 6-digit code sent to ${verificationEmail}.`
                : modeContent.subtitle}
            </p>
          </div>

          {!showVerificationStep && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {currentMode === 'signup' && (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white">Username</span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    className="w-full rounded-2xl border border-stroke bg-[#171717] px-4 py-3 text-sm text-white outline-none placeholder:text-textSoft focus:border-accent"
                    required
                  />
                </label>
              )}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-white">Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  className="w-full rounded-2xl border border-stroke bg-[#171717] px-4 py-3 text-sm text-white outline-none placeholder:text-textSoft focus:border-sky-500"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-white">Password</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  className="w-full rounded-2xl border border-stroke bg-[#171717] px-4 py-3 text-sm text-white outline-none placeholder:text-textSoft focus:border-accent"
                  required
                />
              </label>

              {error && <p className="text-sm text-red-400">{error}</p>}
              {message && <p className="text-sm text-emerald-400">{message}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  currentMode === 'login'
                    ? 'bg-sky-500 hover:bg-sky-400'
                    : 'bg-accent hover:bg-[#ff9a40]'
                }`}
              >
                {isSubmitting ? 'Please wait...' : modeContent.buttonLabel}
              </button>
            </form>
          )}

          {showVerificationStep && (
            <form className="space-y-4" onSubmit={handleVerifyEmail}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white">Verification code</span>
                <input
                  type="text"
                  name="verificationCode"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-2xl border border-stroke bg-[#171717] px-4 py-3 text-sm text-white outline-none placeholder:text-textSoft focus:border-accent"
                  required
                />
              </label>

              {error && <p className="text-sm text-red-400">{error}</p>}
              {message && <p className="text-sm text-emerald-400">{message}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff9a40] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Please wait...' : 'Verify email'}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-stroke bg-[#171717] px-4 py-3 text-sm font-semibold text-white transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-70"
              >
                Resend code
              </button>
            </form>
          )}

          {!showVerificationStep && (
            <p className="mt-5 text-center text-sm text-textSoft">
              {modeContent.helperText}{' '}
              <button
                type="button"
                onClick={() => switchMode(modeContent.switchTo)}
                className="font-semibold text-white transition hover:text-accent"
              >
                {modeContent.switchLabel}
              </button>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
