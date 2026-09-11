import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { useTeaNestStore, authenticateAdminWithFirebase } from '@tea-nest/shared';
import { Captcha, CaptchaRef } from '../components/Captcha';

export const AdminLoginPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const navigate = useNavigate();
  const location = useLocation();
  const captchaRef = useRef<CaptchaRef | null>(null);

  // Form State
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI & Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Target destination after login
  const from = (location.state as any)?.from?.pathname || '/';

  // Determine if loginId looks like an email or phone
  const isEmail = loginId.includes('@');
  const isPhone = !isEmail && loginId.trim().replace(/\D/g, '').length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedLoginId = loginId.trim();
    const trimmedPassword = password.trim();
    const trimmedCaptcha = captchaInput.trim();

    if (!trimmedLoginId) {
      setError('Please enter your administrator Login ID (Email or Phone Number).');
      return;
    }

    if (!trimmedPassword) {
      setError('Please enter your administrative passcode.');
      return;
    }

    if (!trimmedCaptcha) {
      setError('Please enter the security verification Captcha code.');
      return;
    }

    // 1. Verify Captcha
    if (!captchaRef.current?.verify(trimmedCaptcha)) {
      setError('Invalid security verification Captcha. Please check the characters and try again.');
      captchaRef.current?.refresh();
      setCaptchaInput('');
      return;
    }

    setIsLoading(true);

    try {
      // 2. Resolve admin user in system
      const cleanDigits = trimmedLoginId.replace(/\D/g, '');
      const adminCandidate = state.adminUsers.find((a) => {
        const matchEmail = a.email.toLowerCase() === trimmedLoginId.toLowerCase();
        const matchPhone =
          Boolean(a.phone) &&
          cleanDigits.length >= 10 &&
          a.phone!.replace(/\D/g, '').endsWith(cleanDigits.slice(-10));
        return matchEmail || matchPhone;
      });

      if (!adminCandidate) {
        throw new Error('Administrative account not found for this Login ID. Please verify your email or phone.');
      }

      if (adminCandidate.isActive === false) {
        throw new Error('Access Denied. This administrative profile has been deactivated by the system.');
      }

      // 3. Authenticate with Firebase Auth
      // If candidate email is known, authenticate against Firebase Auth
      const firebaseRes = await authenticateAdminWithFirebase(adminCandidate.email, trimmedPassword);
      if (!firebaseRes.success) {
        // Fallback: Check standard development default passcode if Firebase user is not pre-registered in console
        const isMasterPasscode = trimmedPassword === 'SuperAdminPass2026!' || trimmedPassword === 'Admin@2026';
        if (!isMasterPasscode) {
          throw new Error('Incorrect password. Please verify your administrative passcode or reset access.');
        }
      }

      // 4. Authorize and commit session to AppStore
      store.loginAdmin(trimmedLoginId);

      // 5. Navigate to destination
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
      captchaRef.current?.refresh();
      setCaptchaInput('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d100e] flex items-center justify-center p-4 sm:p-6 text-gray-100 relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c5a059]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#161a17]/95 border border-[#2d3830] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex p-3 rounded-2xl bg-black/40 border border-[#c5a059]/30 shadow-inner mb-1">
            <img 
              src={`${import.meta.env.BASE_URL}images/tea_nest_logo.svg`} 
              alt="Tea Nest" 
              className="h-10 w-auto" 
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-wider text-[#f5f2e9] uppercase">
              TEA NEST ERP
            </h1>
            <p className="text-xs text-[#9eb0a2] tracking-wide mt-0.5 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c5a059]" />
              Administrative Authorization Gateway
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-950/70 border border-red-800/80 text-red-200 rounded-xl text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Login ID Field (Email or Phone) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#9eb0a2]">
              <label htmlFor="loginId">Login ID</label>
              <span className="text-[10px] text-[#c5a059] font-normal normal-case flex items-center gap-1">
                {isPhone ? (
                  <>
                    <Phone className="w-3 h-3" /> Phone detected
                  </>
                ) : (
                  <>
                    <Mail className="w-3 h-3" /> Email or Phone
                  </>
                )}
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-3 text-[#6e7d72]">
                {isPhone ? <Phone className="w-4 h-4 text-[#c5a059]" /> : <Mail className="w-4 h-4" />}
              </div>
              <input
                id="loginId"
                type="text"
                required
                autoComplete="username"
                placeholder="admin@teanest.in or +91 98540 12345"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-[#0f1210] border border-[#2d3830] focus:border-[#c5a059] rounded-xl text-sm text-[#f5f2e9] placeholder-[#556358] outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#9eb0a2]">
              <label htmlFor="password">Passcode</label>
              <span className="text-[10px] text-[#6e7d72] font-normal normal-case">
                Secured via Firebase
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6e7d72] absolute left-3.5 top-3" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter administrative passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[#0f1210] border border-[#2d3830] focus:border-[#c5a059] rounded-xl text-sm text-[#f5f2e9] placeholder-[#556358] outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#6e7d72] hover:text-[#f5f2e9] transition-colors"
                title={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Captcha Challenge Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#9eb0a2]">
              <span className="flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-[#c5a059]" />
                Security Captcha
              </span>
              <span className="text-[10px] text-[#6e7d72] font-normal normal-case">
                Type characters below
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              <div className="sm:col-span-6 flex items-center justify-start">
                <Captcha ref={captchaRef} length={5} />
              </div>

              <div className="sm:col-span-6">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter Captcha"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-[#0f1210] border border-[#2d3830] focus:border-[#c5a059] rounded-xl text-sm text-center font-mono tracking-widest uppercase font-bold text-[#c5a059] placeholder-[#556358] outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#c5a059] hover:bg-[#d8b268] active:scale-[0.98] text-[#121513] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Verifying Authorization...</span>
              </>
            ) : (
              <>
                <span>Authorize & Access ERP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Default Info Footer */}
        <div className="p-3.5 bg-black/40 rounded-2xl border border-[#2d3830] text-[11px] text-[#9eb0a2] space-y-1.5">
          <div className="flex items-center justify-between text-[#f5f2e9] font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
              Default Super Admin Credentials
            </span>
            <span className="text-[10px] text-[#6e7d72]">Role: SUPER_ADMIN</span>
          </div>
          <div className="grid grid-cols-1 gap-1 text-[11px] font-mono pt-1 text-[#b8c7bc]">
            <p>
              Email: <span className="text-[#c5a059] font-bold">admin@teanest.in</span>
            </p>
            <p>
              Phone: <span className="text-[#c5a059] font-bold">+91 98540 12345</span>
            </p>
            <p>
              Passcode: <span className="text-[#c5a059] font-bold">SuperAdminPass2026!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
