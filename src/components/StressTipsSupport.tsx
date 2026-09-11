import React, { useState } from 'react';
import { 
  Heart, 
  ShieldAlert, 
  Wind, 
  Sparkles, 
  CheckCircle2, 
  PhoneCall, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  HelpCircle,
  Eye,
  Volume2,
  RefreshCw,
  Sun,
  Flame,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StressCategory } from '../types';

interface StressTipsSupportProps {
  currentCategory?: StressCategory;
  stressScore?: number;
  onSelectBreathing?: () => void;
}

export const StressTipsSupport: React.FC<StressTipsSupportProps> = ({
  currentCategory = 'LOW',
  stressScore = 25,
  onSelectBreathing,
}) => {
  const [activeTab, setActiveTab] = useState<StressCategory>(currentCategory);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [breathCount, setBreathCount] = useState<number>(0);
  const [breathTimer, setBreathTimer] = useState<NodeJS.Timeout | null>(null);

  // Sync tab when assessment category changes
  React.useEffect(() => {
    if (currentCategory) {
      setActiveTab(currentCategory);
    }
  }, [currentCategory]);

  const handleCopySupportNote = () => {
    const note = `Immediate Calming Anchor:
1. Inhale slowly through your nose for 4 seconds.
2. Hold gently for 7 seconds.
3. Exhale smoothly for 8 seconds.
4. Name 5 things you see, 4 things you can feel, 3 things you hear, 2 things you smell, and 1 positive affirmation.
24/7 Helpline: 6379234471`;
    navigator.clipboard.writeText(note);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2500);
  };

  const startGuidedBreath = (mode: 'box' | '478' | 'sigh') => {
    if (breathTimer) clearInterval(breathTimer);
    setBreathPhase('inhale');
    setBreathCount(mode === '478' ? 4 : mode === 'box' ? 4 : 2);

    let count = mode === '478' ? 4 : mode === 'box' ? 4 : 2;
    let phase: 'inhale' | 'hold' | 'exhale' = 'inhale';

    const timer = setInterval(() => {
      count -= 1;
      setBreathCount(count);

      if (count <= 0) {
        if (mode === '478') {
          if (phase === 'inhale') {
            phase = 'hold';
            count = 7;
          } else if (phase === 'hold') {
            phase = 'exhale';
            count = 8;
          } else {
            phase = 'inhale';
            count = 4;
          }
        } else if (mode === 'box') {
          if (phase === 'inhale') {
            phase = 'hold';
            count = 4;
          } else if (phase === 'hold') {
            phase = 'exhale';
            count = 4;
          } else {
            phase = 'inhale';
            count = 4;
          }
        } else {
          // Physiological sigh
          if (phase === 'inhale') {
            phase = 'exhale';
            count = 6;
          } else {
            phase = 'inhale';
            count = 3;
          }
        }
        setBreathPhase(phase);
        setBreathCount(count);
      }
    }, 1000);

    setBreathTimer(timer);
  };

  const stopGuidedBreath = () => {
    if (breathTimer) clearInterval(breathTimer);
    setBreathPhase('idle');
    setBreathCount(0);
  };

  return (
    <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <h3 className="font-bold text-stone-900 text-lg tracking-tight">
              Personalized Tips & Support by Stress Level
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            Scientifically grounded physiological recommendations and emergency support resources tailored for your state.
          </p>
        </div>

        {/* Level Switcher Tabs */}
        <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('LOW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'LOW'
                ? 'bg-sky-100 text-sky-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Low (0–39)</span>
          </button>

          <button
            onClick={() => setActiveTab('MEDIUM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'MEDIUM'
                ? 'bg-[#FFF3CD] text-[#664D03] shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Medium (40–69)</span>
          </button>

          <button
            onClick={() => setActiveTab('HIGH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'HIGH'
                ? 'bg-[#F8D7DA] text-[#842029] shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>High Risk (70–100)</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ================= LOW STRESS (0–39) ================= */}
        {activeTab === 'LOW' && (
          <motion.div
            key="low"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Status Banner */}
            <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900">
                  Equilibrium & Parasympathetic Tone Verified
                </h4>
                <p className="text-xs text-stone-700 mt-0.5">
                  Your vocal cords exhibit steady cadence, relaxed phonation, and low jitter. Maintain this equilibrium with simple preventive habits.
                </p>
              </div>
            </div>

            {/* Tips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-sky-700" />
                  Vocal Cord Hydration
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Sip room-temperature water every 30 minutes. Adequate laryngeal hydration reduces subglottic pressure and eliminates pitch jitter.
                </p>
                <div className="text-[11px] text-sky-800 font-medium">
                  ✓ Minimizes vocal fatigue during long flights or meetings
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-700" />
                  Box Breathing Cadence
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Practice 4-4-4-4 rhythm: 4 seconds in, 4 seconds hold, 4 seconds out, 4 seconds hold. Stabilizes heart rate variability (HRV).
                </p>
                <button
                  onClick={() => startGuidedBreath('box')}
                  className="text-xs text-sky-800 font-semibold hover:underline flex items-center gap-1"
                >
                  Start Box Breathing Pacer
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
                  Proactive Routine
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Maintain regular sleep schedules, steady vocal hydration, and mindful micro-breaks while your nervous system remains balanced.
                </p>
                <div className="text-[11px] text-stone-400">
                  Builds neuro-resilience against future acute stress spikes
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= MEDIUM STRESS (40–69) ================= */}
        {activeTab === 'MEDIUM' && (
          <motion.div
            key="medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Status Banner */}
            <div className="p-4 rounded-2xl bg-[#FFF3CD]/60 border border-[#664D03]/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFF3CD] text-[#664D03] flex items-center justify-center font-bold shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#664D03]">
                  Elevated Vocal Cadence & Physical Strain Detected
                </h4>
                <p className="text-xs text-stone-700 mt-0.5">
                  Your speech exhibits accelerated words-per-minute, truncated micro-pauses, or fatigue. Apply quick de-escalation methods now.
                </p>
              </div>
            </div>

            {/* Tips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-amber-700" />
                  4-7-8 Diaphragmatic Breath
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Inhale through the nose for 4s, hold for 7s, exhale completely through mouth for 8s. Directly engages the vagus nerve brake.
                </p>
                <button
                  onClick={() => startGuidedBreath('478')}
                  className="text-xs text-amber-800 font-semibold hover:underline flex items-center gap-1"
                >
                  Start 4-7-8 Breathing Guide
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  5-4-3-2-1 Sensory Grounding
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Name 5 things you see, 4 you can physically touch, 3 sounds you hear, 2 scents, and 1 positive affirmation. Pulls focus out of distress loops.
                </p>
                <div className="text-[11px] text-amber-900 font-medium">
                  ✓ Re-centers prefrontal cortex cognitive control
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  Pre-Escalation Check-in
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Take a 5-minute break away from high-stimulus screens, stretch your shoulders and neck, and reach out to a trusted peer.
                </p>
                <div className="text-[11px] text-stone-400">
                  Prevents cognitive exhaustion from deepening into acute panic
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= HIGH RISK LEVEL (70–100) ================= */}
        {activeTab === 'HIGH' && (
          <motion.div
            key="high"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Status Banner */}
            <div className="p-4 rounded-2xl bg-[#F8D7DA]/70 border border-[#842029]/30 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F8D7DA] text-[#842029] flex items-center justify-center font-bold shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#842029]">
                  Critical Vocal Distress Protocol Active
                </h4>
                <p className="text-xs text-stone-800 mt-0.5 leading-relaxed">
                  Acute autonomic nervous system arousal detected. Emergency support protocol is armed. Utilize immediate somatic down-regulation and 24/7 Helpline (6379234471).
                </p>
              </div>
            </div>

            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Emergency Breathing */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
                <div className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-rose-700" />
                  Physiological Sigh (Instant Reset)
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Take two consecutive quick sniffs through your nose, then one prolonged, slow exhale through your mouth. Immediately reduces acute tachycardia.
                </p>
                <button
                  onClick={() => startGuidedBreath('sigh')}
                  className="text-xs text-rose-900 font-semibold hover:underline flex items-center gap-1"
                >
                  Start Physiological Sigh
                </button>
              </div>

              {/* Grounding Anchor Note */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
                <div className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-rose-700" />
                  Sensory Grounding Anchor
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Copy quick mental anchors and breathing cues to anchor your nervous system immediately.
                </p>
                <button
                  onClick={handleCopySupportNote}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs mt-1"
                >
                  {copiedMemo ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedMemo ? 'Copied to Clipboard!' : 'Copy Grounding Anchor'}
                </button>
              </div>

              {/* 24/7 Hotlines Direct Dial */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
                <div className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-rose-700" />
                  24/7 Crisis & Wellbeing Helplines
                </div>
                <div className="space-y-1.5 pt-1">
                  <a
                    href="tel:6379234471"
                    className="block text-xs font-mono font-bold text-rose-900 hover:underline"
                  >
                    Direct Helpline: 6379234471
                  </a>
                  <a
                    href="tel:6379234471"
                    className="block text-xs font-mono font-bold text-stone-800 hover:underline"
                  >
                    India Crisis Support: 6379234471
                  </a>
                  <a
                    href="tel:6379234471"
                    className="block text-xs font-mono font-bold text-stone-800 hover:underline"
                  >
                    Wellbeing Helpline: 6379234471
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guided Breathing Overlay Pacer */}
      {breathPhase !== 'idle' && (
        <div className="p-5 bg-[#FAF9F6] border border-stone-300/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{
                scale: breathPhase === 'inhale' ? 1.4 : breathPhase === 'hold' ? 1.4 : 1,
                backgroundColor: breathPhase === 'inhale' ? '#BAE6FD' : breathPhase === 'hold' ? '#FFF3CD' : '#F8D7DA'
              }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm shadow-xs"
            >
              {breathCount}s
            </motion.div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Active Grounding Guide
              </div>
              <div className="text-base font-extrabold text-stone-900 capitalize">
                {breathPhase === 'inhale' ? 'Inhale deeply through nose...' : breathPhase === 'hold' ? 'Gently hold breath...' : 'Slow, complete exhale through mouth...'}
              </div>
            </div>
          </div>

          <button
            onClick={stopGuidedBreath}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
          >
            End Breathing Pacer
          </button>
        </div>
      )}
    </div>
  );
};

export default StressTipsSupport;
