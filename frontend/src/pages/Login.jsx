import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';

export default function Login() {
  const [registration_number, setRegNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(registration_number, password);
      navigate(user.role === 'student' ? '/student' : '/cr');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const [loginImageExists, setLoginImageExists] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoginImageExists(true);
    img.onerror = () => setLoginImageExists(false);
    img.src = `${API_BASE_URL}/public/login-image.png`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-6xl">
        <div className="card overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left image / branding area */}
          <div className="bg-gradient-to-b from-black/60 to-black/40 p-8 flex flex-col justify-between min-h-[420px]">
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-56 border-2 border-white/5 rounded-lg flex items-center justify-center text-mist/60 overflow-hidden">
                {loginImageExists ? (
                  <img src={`${API_BASE_URL}/public/login-image.png`} alt="campus" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <svg className="mx-auto mb-3 w-10 h-10 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <div className="text-sm text-mist/60">your campus photo here</div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-white font-semibold">Ardhi University</h3>
              <p className="text-mist text-sm mt-1">Information Systems Management</p>
            </div>
          </div>

          {/* Right form area */}
          <div className="p-8">
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-3 justify-start mb-6">
                <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-display text-xl font-semibold">Presence</h1>
                  <p className="text-xs text-mist -mt-0.5">QR Attendance System</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="">
                <h2 className="font-display text-lg font-semibold mb-1">Sign in</h2>
                <p className="text-sm text-mist mb-6">Use your registration number and password.</p>

                <label className="block text-xs font-medium text-mist mb-1.5">Registration number</label>
                <input
                  className="input-field mb-4"
                  placeholder="e.g. T21-03-12345"
                  value={registration_number}
                  onChange={(e) => setRegNumber(e.target.value)}
                  autoFocus
                  required
                />

                <label className="block text-xs font-medium text-mist mb-1.5">Password</label>
                <input
                  className="input-field mb-5"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {error && (
                  <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 mb-4">
                    {error}
                  </p>
                )}

                <button type="submit" className="btn-primary w-full" disabled={submitting}>
                  {submitting ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="text-center text-xs text-mist mt-6">
                Forgot your credentials? Contact your class representative or department admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
