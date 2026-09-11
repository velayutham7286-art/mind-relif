import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  ShieldCheck, 
  AlertCircle,
  Mail,
  User,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Info,
  KeyRound
} from 'lucide-react';
import { UserProfile } from '../types';
import { identifyUserLocation } from '../lib/locationService';
import { signInWithGoogle, signInWithGmailAddress } from '../lib/firebase';
import Logo from './Logo';

interface UserLoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onNavigateToHome: () => void;
  onNavigateToAdminLogin: () => void;
}

export const UserLoginPage: React.FC<UserLoginPageProps> = ({
  onLoginSuccess,
  onNavigateToHome,
  onNavigateToAdminLogin,
}) => {
  // Gmail input states
  const [gmailAddress, setGmailAddress] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Load remembered info on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('mindease_last_gmail');
      const savedName = localStorage.getItem('mindease_last_name');
      const savedPhone = localStorage.getItem('mindease_last_phone');
      if (savedEmail) setGmailAddress(savedEmail);

      if (savedName) setFullName(savedName);
      if (savedPhone) setPhoneNumber(savedPhone);
    } catch {}
  }, []);

  // Common Country Codes
  const countryCodes = [
    { code: '+91', country: 'IN (+91)' },
    { code: '+1', country: 'US/CA (+1)' },
    { code: '+44', country: 'UK (+44)' },
    { code: '+65', country: 'SG (+65)' },
    { code: '+971', country: 'UAE (+971)' },
    { code: '+61', country: 'AU (+61)' },
    { code: '+49', country: 'DE (+49)' },
    { code: '+33', country: 'FR (+33)' },
    { code: '+81', country: 'JP (+81)' },
  ];

  const getFullPhone = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned ? `${countryCode} ${cleaned}` : '';
  };

  // 1. DIRECT GMAIL / EMAIL AUTHENTICATION
  const handleDirectGmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    let emailToUse = gmailAddress.trim().toLowerCase();
    if (!emailToUse) {
      setErrorMsg('Please enter your Gmail address.');
      emailInputRef.current?.focus();
      return;
    }

    // Auto-append @gmail.com if only username was provided
    if (!emailToUse.includes('@')) {
      emailToUse = `${emailToUse}@gmail.com`;
      setGmailAddress(emailToUse);
    }

    if (!emailToUse.includes('.') || emailToUse.indexOf('@') >= emailToUse.lastIndexOf('.')) {
      setErrorMsg('Please provide a valid email format (such as name@gmail.com).');
      return;
    }

    const fullPhone = getFullPhone();
    setIsLoading(true);

    try {
      // Authenticate with Gmail profile and sync to Firestore
      const { user: profile } = await signInWithGmailAddress(
        emailToUse,
        fullName.trim(),
        fullPhone
      );

      // Save for next session
      try {
        localStorage.setItem('mindease_last_gmail', emailToUse);
        if (fullName.trim()) localStorage.setItem('mindease_last_name', fullName.trim());
        if (phoneNumber.trim()) localStorage.setItem('mindease_last_phone', phoneNumber.trim());
      } catch {}

      // Auto-identify location for emergency readiness
      let detectedLoc = profile.location;
      if (!detectedLoc) {
        try {
          const locRes = await Promise.race([
            identifyUserLocation(profile.id),
            new Promise<null>((r) => setTimeout(() => r(null), 1500))
          ]);
          if (locRes && locRes.success) {
            detectedLoc = locRes.location;
          }
        } catch {}
      }

      onLoginSuccess({
        ...profile,
        location: detectedLoc || profile.location,
        phone: fullPhone || profile.phone,
        emergencyPhone: fullPhone || profile.emergencyPhone || '6379234471'
      });
    } catch (err: any) {
      console.error('Gmail login error:', err);
      setErrorMsg(err.message || 'Unable to sign in with Gmail. Please check details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. GOOGLE OAUTH POPUP SIGN-IN
  const handleGoogleOAuthSignIn = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);

    const fullPhone = getFullPhone();

    try {
      const { user: profile, firebaseUser } = await signInWithGoogle(fullPhone);

      // Save user email to localStorage
      if (profile.email) {
        try {
          localStorage.setItem('mindease_last_gmail', profile.email);
          localStorage.setItem('mindease_last_name', profile.name);
        } catch {}
      }

      // Auto-identify location
      let detectedLoc = profile.location;
      if (!detectedLoc) {
        try {
          const locRes = await Promise.race([
            identifyUserLocation(profile.id),
            new Promise<null>((r) => setTimeout(() => r(null), 1500))
          ]);
          if (locRes && locRes.success) {
            detectedLoc = locRes.location;
          }
        } catch {}
      }

      onLoginSuccess({
        ...profile,
        phone: fullPhone || profile.phone,
        emergencyPhone: fullPhone || profile.emergencyPhone || '6379234471',
        location: detectedLoc || profile.location
      });
    } catch (err: any) {
      console.warn('Google OAuth popup notice:', err);
      const errCode = err?.code || '';
      
      if (errCode === 'auth/popup-blocked' || errCode === 'auth/unauthorized-domain' || err?.message?.includes('popup') || err?.message?.includes('domain')) {
        setInfoMsg('Google popup is restricted inside this browser container. Please use the Direct Gmail sign-in below to log into your account instantly.');
        emailInputRef.current?.focus();
      } else if (errCode === 'auth/popup-closed-by-user') {
        setInfoMsg('Google sign-in popup was closed. You can also sign in directly below with your Gmail address.');
      } else {
        setInfoMsg(`Notice: ${err?.message || 'Google popup restricted'}. You can sign in directly below with your Gmail address.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppendGmailDomain = () => {
    if (!gmailAddress.includes('@')) {
      setGmailAddress(`${gmailAddress.trim()}@gmail.com`);
    }
  };

  return (
    <div className="max-w-md mx-auto py-3 sm:py-6 px-1 sm:px-0 space-y-4 sm:space-y-6">
      <button
        onClick={onNavigateToHome}
        className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1.5 font-medium transition-colors min-h-[36px] touch-manipulation"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </button>

      <div className="bg-white border border-stone-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center flex flex-col items-center">
          <Logo size="lg" showText={false} />
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            User Stress Portal
          </h2>
          <p className="text-xs text-stone-500 max-w-xs">
            Sign in with your Gmail account to access speech diagnostics, real-time anxiety metrics, and clinical support.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-xl p-3 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Info / Fallback Notification */}
        {infoMsg && (
          <div className="text-xs bg-sky-50 text-sky-900 border border-sky-200 rounded-xl p-3 flex items-start gap-2 animate-in fade-in">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{infoMsg}</div>
          </div>
        )}

        {/* Primary Method 1: Google OAuth Popup */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleOAuthSignIn}
            disabled={isLoading}
            className="w-full min-h-[46px] py-3 px-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 hover:border-stone-400 rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-3 group disabled:opacity-60 cursor-pointer touch-manipulation"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              or enter your Gmail
            </span>
            <div className="border-t border-stone-200 w-full" />
          </div>
        </div>

        {/* Primary Method 2: Direct Gmail Sign-in Form */}
        <form onSubmit={handleDirectGmailSignIn} className="space-y-4">
          {/* Gmail Address Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-rose-600" />
                <span>Gmail Address</span>
              </label>

              {/* Quick Append Button */}
              {!gmailAddress.includes('@') && gmailAddress.trim().length > 0 && (
                <button
                  type="button"
                  onClick={handleAppendGmailDomain}
                  className="text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md transition-colors touch-manipulation min-h-[28px]"
                >
                  + @gmail.com
                </button>
              )}
            </div>

            <div className="relative">
              <input
                ref={emailInputRef}
                type="email"
                required
                value={gmailAddress}
                onChange={(e) => {
                  setGmailAddress(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="yourname@gmail.com"
                className="w-full text-base sm:text-xs min-h-[44px] px-3.5 py-2.5 bg-white border border-stone-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 rounded-xl font-medium text-stone-900 focus:outline-hidden transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Full Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-500" />
              <span>Your Name (Optional)</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full text-base sm:text-xs min-h-[44px] px-3.5 py-2.5 bg-white border border-stone-300 focus:border-stone-500 focus:ring-2 focus:ring-stone-200 rounded-xl text-stone-900 focus:outline-hidden transition-all shadow-2xs"
            />
          </div>

          {/* Emergency Phone Number Field */}
          <div className="space-y-1.5 p-3 sm:p-3.5 bg-stone-50/70 border border-stone-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-stone-600" />
                <span>Mobile Phone (Emergency SMS)</span>
              </label>
              <span className="text-[10px] text-stone-500 font-medium">Recommended</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full sm:w-28 text-base sm:text-xs min-h-[44px] px-2.5 py-2 bg-white border border-stone-300 rounded-xl font-mono text-stone-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-stone-300 shadow-2xs"
              >
                {countryCodes.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.country}
                  </option>
                ))}
              </select>

              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="6379234471"
                className="flex-1 text-base sm:text-xs min-h-[44px] px-3.5 py-2 bg-white border border-stone-300 rounded-xl font-mono text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-300 shadow-2xs"
              />
            </div>
            <p className="text-[10px] text-stone-500 pt-1">
              Used for Twilio emergency SMS notification if severe stress or crisis levels are detected.
            </p>
          </div>

          {/* Direct Sign-In Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[46px] py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 group disabled:opacity-70 cursor-pointer touch-manipulation"
          >
            <Mail className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{isLoading ? 'Signing in...' : 'Sign In with Gmail'}</span>
          </button>
        </form>

        {/* Security & Cloud Sync Notice */}
        <div className="p-3 bg-[#FAF9F6] border border-stone-200 rounded-xl text-[11px] text-stone-600 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-stone-800">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
            <span>Secure Cloud Synchronized Profile</span>
          </div>
          <p className="leading-relaxed">
            Your assessment history, acoustic stress trends, and emergency protocols are safely synced with your account.
          </p>
        </div>

        {/* Switch to Admin Portal */}
        <div className="text-center pt-1 border-t border-stone-100">
          <button
            onClick={onNavigateToAdminLogin}
            className="text-xs text-stone-600 hover:text-stone-900 hover:underline font-medium inline-flex items-center gap-1 min-h-[36px] touch-manipulation"
          >
            <KeyRound className="w-3 h-3 text-stone-500" />
            <span>Clinician or Admin Access? Switch to Admin Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserLoginPage;
