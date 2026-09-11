import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Phone, 
  LogOut, 
  UserCheck, 
  CheckCircle2, 
  Brain,
  FileText,
  AlertCircle,
  Home,
  LogIn,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  Activity
} from 'lucide-react';
import { UserProfile, UserRole, AssessmentResult } from './types';
import { initialUser } from './lib/store';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, signOutUser } from './lib/firebase';
import UserDashboard from '../app/dashboard/page';
import AdminDashboard from '../app/admin/page';
import HomePage from './components/HomePage';
import UserLoginPage from './components/UserLoginPage';
import AdminLoginPage from './components/AdminLoginPage';
import GeminiChatView from './components/GeminiChatView';
import Logo from './components/Logo';

type AppPage = 'home' | 'login-user' | 'login-admin' | 'dashboard' | 'admin' | 'chat';

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('mindease_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentResult | null>(null);

  // Synchronize Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && !currentUser) {
        let profileData: Partial<UserProfile> | null = null;
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            profileData = userDoc.data() as UserProfile;
          }
        } catch {}

        const liveUser: UserProfile = {
          id: fbUser.uid,
          name: profileData?.name || fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'MindEase User'),
          email: profileData?.email || fbUser.email || 'user@mindease.care',
          role: 'USER',
          phone: profileData?.phone || fbUser.phoneNumber || '+91 98401 23456',
          emergencyPhone: profileData?.emergencyPhone || '6379234471',
          emergencyContactName: profileData?.emergencyContactName || 'Dr. A. Ramanathan',
          emergencyContactRelationship: profileData?.emergencyContactRelationship || 'Primary Care Physician / Family',
          city: profileData?.city || 'Chennai',
          region: profileData?.region || 'Tamil Nadu',
          country: profileData?.country || 'India',
          currentHostCountry: profileData?.currentHostCountry || 'India',
          passportCountry: profileData?.passportCountry || 'India',
          location: profileData?.location || initialUser.location,
          status: 'ACTIVE',
          photoURL: fbUser.photoURL || undefined
        };
        setCurrentUser(liveUser);
        try {
          localStorage.setItem('mindease_user', JSON.stringify(liveUser));
        } catch {}
        fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(liveUser)
        }).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Sync current user with server store & localStorage whenever user profile changes
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('mindease_user', JSON.stringify(currentUser));
      } catch {}
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentUser)
      }).catch(() => {});
    }
  }, [currentUser]);

  // Sign in handlers
  const handleUserLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('mindease_user', JSON.stringify(user));
    } catch {}
    setCurrentPage('dashboard');
  };

  const handleAdminLoginSuccess = (admin: UserProfile) => {
    setCurrentUser(admin);
    try {
      localStorage.setItem('mindease_user', JSON.stringify(admin));
    } catch {}
    setCurrentPage('admin');
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch {}
    try {
      localStorage.removeItem('mindease_user');
    } catch {}
    setCurrentUser(null);
    setCurrentPage('home');
    setShowRoleModal(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 flex flex-col selection:bg-sky-100 selection:text-sky-900">
      {/* Top Calming Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200/70 px-3 sm:px-6 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Tagline (Clickable to Home) */}
          <button 
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 sm:gap-3 text-left group hover:opacity-90 transition-opacity shrink-0 min-h-[40px]"
            title="MindEase Stress Relief App - Home"
          >
            <Logo size="sm" showText={true} subtitle="Stress Relief App" />
          </button>

          {/* Center Navigation Tabs (Desktop only; on mobile, native bottom bar is used) */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl border border-stone-200/80">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPage === 'home'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            {currentUser && (
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentPage === 'dashboard'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                <span>Voice Check-in</span>
              </button>
            )}

            <button
              onClick={() => setCurrentPage('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPage === 'chat'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Gemini AI Chat</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-teal-100/80 text-teal-800 rounded-md">
                Multi-Turn
              </span>
            </button>
          </nav>

          {/* Right Side: Authentication / Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowRoleModal(!showRoleModal)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-colors shadow-2xs text-left min-h-[40px] touch-manipulation"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/70 flex items-center justify-center font-bold text-xs text-teal-800">
                    {currentUser.name[0]}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-stone-900 leading-tight flex items-center gap-1">
                      <span className="truncate max-w-[110px]">{currentUser.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        currentUser.role === 'ADMIN' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}>
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-teal-600 font-medium leading-none">
                      Firebase Synced
                    </div>
                  </div>
                </button>

                {/* Account Dropdown */}
                {showRoleModal && (
                  <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-xl border border-stone-200 p-3 z-50 space-y-2">
                    <div className="px-2 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      Account Session
                    </div>
                    <div className="px-2 py-1 text-xs text-stone-600">
                      <div className="font-semibold text-stone-900">{currentUser.name}</div>
                      <div className="text-[11px] text-stone-400 truncate">{currentUser.email}</div>
                    </div>

                    <div className="border-t border-stone-100 pt-2 space-y-1">
                      <button
                        onClick={() => {
                          setShowRoleModal(false);
                          setCurrentPage('dashboard');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 font-medium min-h-[38px]"
                      >
                        <Activity className="w-4 h-4 text-stone-500" />
                        <span>Voice Dashboard</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowRoleModal(false);
                          setCurrentPage('chat');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 font-medium min-h-[38px]"
                      >
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>Gemini Chat Interface</span>
                      </button>
                      {currentUser.role === 'ADMIN' && (
                        <button
                          onClick={() => {
                            setShowRoleModal(false);
                            setCurrentPage('admin');
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium min-h-[38px]"
                        >
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          <span>Admin Console</span>
                        </button>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium min-h-[38px]"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Sign Out & Return Home</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage('login-user')}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors flex items-center gap-1.5 min-h-[38px] touch-manipulation"
                >
                  <LogIn className="w-3.5 h-3.5 text-stone-600" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Routing */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-24 md:pb-8">
        {currentPage === 'home' && (
          <HomePage
            onNavigateToUserLogin={() => setCurrentPage('login-user')}
            onNavigateToAdminLogin={() => setCurrentPage('login-admin')}
          />
        )}

        {currentPage === 'login-user' && (
          <UserLoginPage
            onLoginSuccess={handleUserLoginSuccess}
            onNavigateToHome={() => setCurrentPage('home')}
            onNavigateToAdminLogin={() => setCurrentPage('login-admin')}
          />
        )}

        {currentPage === 'login-admin' && (
          <AdminLoginPage
            onLoginSuccess={handleAdminLoginSuccess}
            onNavigateToHome={() => setCurrentPage('home')}
            onNavigateToUserLogin={() => setCurrentPage('login-user')}
          />
        )}

        {currentPage === 'dashboard' && (
          <UserDashboard 
            user={currentUser || initialUser}
            onUpdateUser={(updated) => setCurrentUser(updated)}
            onNavigateToAdmin={() => {
              setCurrentPage('admin');
            }}
          />
        )}

        {currentPage === 'admin' && (
          <AdminDashboard 
            currentUser={currentUser || initialUser}
            onSwitchToUserMode={() => {
              setCurrentPage('dashboard');
            }}
          />
        )}

        {currentPage === 'chat' && (
          <GeminiChatView
            user={currentUser || initialUser}
            latestAssessment={latestAssessment}
            onNavigateToDashboard={() => setCurrentPage('dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200/70 py-6 px-4 text-center text-xs text-stone-500 space-y-2 mb-16 md:mb-0">
        <div className="flex items-center justify-center gap-2">
          <Logo size="xs" showText={false} />
          <span className="font-semibold text-stone-700">MindEase</span>
          <span>•</span>
          <span>Stress Relief & Vocal Biomarker Platform</span>
        </div>
        <p className="text-[11px] text-stone-400">
          Real-Time Voice Analysis • Google Firebase Auth & Firestore • 24/7 Crisis Support: 6379234471
        </p>
      </footer>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile screens < 768px) */}
      <nav 
        aria-label="Mobile Navigation" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-stone-200/90 py-1.5 px-3 flex justify-around items-center shadow-lg safe-area-bottom"
      >
        <button
          onClick={() => {
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] min-h-[44px] touch-manipulation ${
            currentPage === 'home'
              ? 'text-stone-950 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Home className={`w-5 h-5 ${currentPage === 'home' ? 'text-stone-900' : 'text-stone-500'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </button>

        <button
          onClick={() => {
            if (currentUser) {
              setCurrentPage('dashboard');
            } else {
              setCurrentPage('login-user');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] min-h-[44px] touch-manipulation ${
            currentPage === 'dashboard'
              ? 'text-rose-700 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Activity className={`w-5 h-5 ${currentPage === 'dashboard' ? 'text-rose-600' : 'text-stone-500'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Check-in</span>
        </button>

        <button
          onClick={() => {
            setCurrentPage('chat');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] min-h-[44px] touch-manipulation ${
            currentPage === 'chat'
              ? 'text-teal-800 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <Sparkles className={`w-5 h-5 ${currentPage === 'chat' ? 'text-teal-600' : 'text-stone-500'}`} />
            <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-teal-500" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">AI Chat</span>
        </button>

        {currentUser ? (
          currentUser.role === 'ADMIN' ? (
            <button
              onClick={() => {
                setCurrentPage('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] min-h-[44px] touch-manipulation ${
                currentPage === 'admin'
                  ? 'text-rose-800 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <ShieldAlert className={`w-5 h-5 ${currentPage === 'admin' ? 'text-rose-600' : 'text-stone-500'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">Admin</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setShowRoleModal(true);
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] min-h-[44px] touch-manipulation ${
                showRoleModal
                  ? 'text-sky-800 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold border border-teal-300">
                {currentUser.name[0]}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Account</span>
            </button>
          )
        ) : (
          <button
            onClick={() => {
              setCurrentPage('login-user');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] min-h-[44px] touch-manipulation ${
              currentPage === 'login-user'
                ? 'text-stone-900 font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <LogIn className={`w-5 h-5 ${currentPage === 'login-user' ? 'text-stone-900' : 'text-stone-500'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Sign In</span>
          </button>
        )}
      </nav>
    </div>
  );
}
