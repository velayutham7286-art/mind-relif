import React from 'react';
import { 
  Brain, 
  Mic, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  PhoneCall, 
  HeartHandshake, 
  Activity,
  FileText,
  HelpCircle,
  Wind
} from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo';

interface HomePageProps {
  onNavigateToUserLogin: () => void;
  onNavigateToAdminLogin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToUserLogin,
  onNavigateToAdminLogin,
}) => {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          <Logo size="xl" showText={false} />
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold">
            <span>MindEase • Stress Relief & Vocal Biomarker Platform</span>
          </div>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight"
        >
          A Calm Voice to Identify & Relieve Mental Stress.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto font-normal"
        >
          Mind Ease evaluates your speech through a gentle voice check-in. 
          Identify cognitive stress and somatic body tension in seconds, receive transparent diagnostic insights, and access immediate grounding protocols.
        </motion.p>

        {/* Primary CTA Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-xl mx-auto text-left"
        >
          {/* User Sign In Card */}
          <div 
            onClick={onNavigateToUserLogin}
            className="group p-5 bg-white border border-stone-200 hover:border-sky-400 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base group-hover:text-sky-800 transition-colors">
                  Start Stress Assessment
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Record a short voice sample to identify cognitive and somatic stress.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-sky-700">
              <span>Enter User Dashboard</span>
            </div>
          </div>

          {/* Clinician & Admin Portal Card */}
          <div 
            onClick={onNavigateToAdminLogin}
            className="group p-5 bg-white border border-stone-200 hover:border-stone-400 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base group-hover:text-stone-900 transition-colors">
                  Wellbeing Admin & Telemetry
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Monitor aggregated vocal stress levels, review audit logs, and test emergency helpline notifications.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-700">
              <span>Admin Console</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3-Step Stress Identification Architecture Section */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Guided Stress Identification Pipeline
          </h2>
          <p className="text-xl font-bold text-stone-900">
            How Voice Analysis Identifies Your Stress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-stone-900 text-base">
              Natural Voice Check-in
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Speak naturally for 5–15 seconds: Share how your day or energy feels to capture authentic pitch, tempo, and vocal tension.
            </p>
            <div className="pt-2 text-[11px] text-sky-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Effortless single-recording capture
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF3CD] text-[#664D03] flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-stone-900 text-base">
              Acoustic Analysis
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Analyzes speaking tempo (WPM), hesitation pause ratio, pitch jitter, and vocal fold strain alongside natural language sentiment markers.
            </p>
            <div className="pt-2 text-[11px] text-[#664D03] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Objective vocal frequency diagnostics
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-stone-900 text-base">
              Stress Identification & Relief
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Receive an instant 0–100 Stress Score with 4 transparent diagnostic cards, 24/7 Helpline support (6379234471), and personalized breathing exercises.
            </p>
            <div className="pt-2 text-[11px] text-sky-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Immediate relief & emergency helpline
            </div>
          </div>
        </div>
      </section>

      {/* Emergency & Helpline Support Banner */}
      <section className="bg-white border border-stone-200 rounded-3xl p-8 max-w-5xl mx-auto shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">
              <PhoneCall className="w-3.5 h-3.5 text-sky-800" />
              24/7 Dedicated Support
            </div>
            <h3 className="text-xl font-bold text-stone-900">
              Immediate Crisis & Stress Support Hotline
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
              If your stress assessment indicates high acute stress or you are feeling overwhelmed, 
              direct telephone support is available at <span className="font-bold text-stone-900">6379234471</span> (India) alongside guided 4-7-8 and Box breathing exercises.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={onNavigateToUserLogin}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs text-center"
            >
              Start Your Check-in
            </button>
            <a
              href="tel:6379234471"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs text-center flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Call 6379234471
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
