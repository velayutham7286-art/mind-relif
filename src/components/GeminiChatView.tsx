import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  Brain, 
  Wind, 
  Activity, 
  ShieldAlert, 
  Zap, 
  Layers, 
  HelpCircle,
  Clock,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssessmentResult, UserProfile } from '../types';
import { 
  persistChatMessage, 
  loadChatHistory, 
  clearChatHistory, 
  ChatHistoryMessage 
} from '../lib/firebase';
import Logo from './Logo';

export type ChatTaskType = 'general' | 'fast' | 'complex';

interface GeminiChatViewProps {
  user: UserProfile;
  latestAssessment?: AssessmentResult | null;
  onNavigateToDashboard?: () => void;
}

interface MessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  model: string;
  taskType: ChatTaskType;
  timestamp: string;
  suggestions?: string[];
}

export const GeminiChatView: React.FC<GeminiChatViewProps> = ({
  user,
  latestAssessment,
  onNavigateToDashboard
}) => {
  const [taskType, setTaskType] = useState<ChatTaskType>('general');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingWithFirestore, setIsSyncingWithFirestore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialWelcomeMessage: MessageItem = {
    id: 'welcome-1',
    role: 'model',
    content: `Hello ${user.name || 'there'}. I am MindEase Gemini Assistant, your mental wellbeing and stress relief companion. 

I'm here to support you with multi-turn conversations. You can choose a specialized mode at the top:
- **General Counseling** (powered by \`gemini-3.5-flash\`) for daily stress management and emotional validation
- **Fast Grounding** (powered by \`gemini-3.1-flash-lite\`) for immediate physiological calming
- **In-Depth Analysis** (powered by \`gemini-3.1-pro-preview\`) for exploring root causes and cognitive reframing.

How can I help you find calm right now?`,
    model: 'gemini-3.5-flash',
    taskType: 'general',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestions: [
      'How does voice stress assessment work?',
      'Guide me through a quick breathing exercise',
      'Help me reframe stress from my workday',
      'Emergency Helpline: 6379234471'
    ]
  };

  const [messages, setMessages] = useState<MessageItem[]>([initialWelcomeMessage]);

  // Load chat history from Firestore if available for authenticated user
  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      if (!user?.id) return;
      setIsSyncingWithFirestore(true);
      try {
        const stored = await loadChatHistory(user.id);
        if (isMounted && stored && stored.length > 0) {
          const formatted: MessageItem[] = stored.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            model: m.model,
            taskType: m.taskType,
            timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.warn('Could not load chat history from Firestore:', err);
      } finally {
        if (isMounted) setIsSyncingWithFirestore(false);
      }
    }

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your conversation history?')) return;
    setMessages([initialWelcomeMessage]);
    if (user?.id) {
      await clearChatHistory(user.id);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userTimestamp = new Date().toISOString();
    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      model: taskType === 'complex' ? 'gemini-3.1-pro-preview' : taskType === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash',
      taskType,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    // Persist user turn to Firestore
    if (user?.id) {
      persistChatMessage(user.id, {
        id: userMsg.id,
        role: 'user',
        content: userMsg.content,
        model: userMsg.model,
        taskType: userMsg.taskType,
        timestamp: userTimestamp
      });
    }

    try {
      // Format multi-turn history for the backend
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome-1')
        .map((m) => ({
          role: m.role,
          content: m.content
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          taskType,
          context: {
            userName: user.name,
            stressScore: latestAssessment?.stressScore,
            stressCategory: latestAssessment?.stressCategory,
            primaryEmotion: latestAssessment?.sentimentMetrics?.primaryEmotion,
            highRisk: latestAssessment?.stressCategory === 'HIGH'
          }
        })
      });

      const data = await res.json();
      const modelTimestamp = new Date().toISOString();
      const assistantMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: data.reply || "I am here with you. Take a steady, calming breath.",
        model: data.model || (taskType === 'complex' ? 'gemini-3.1-pro-preview' : taskType === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash'),
        taskType: data.taskType || taskType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: data.suggestions || []
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Persist assistant turn to Firestore
      if (user?.id) {
        persistChatMessage(user.id, {
          id: assistantMsg.id,
          role: 'model',
          content: assistantMsg.content,
          model: assistantMsg.model,
          taskType: assistantMsg.taskType,
          timestamp: modelTimestamp
        });
      }
    } catch (err) {
      console.error('Failed to communicate with chat API:', err);
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: "I'm temporarily experiencing a connection pause. Let's take a slow, grounding breath together: Inhale for 4 seconds, pause for 7, and exhale for 8. Immediate 24/7 crisis support is always open at 6379234471.",
        model: 'offline-coping-engine',
        taskType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: ['Start 4-7-8 Breathing Guide', 'Call Helpline 6379234471']
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDescription = () => {
    switch (taskType) {
      case 'fast':
        return {
          title: 'Rapid Grounding Specialist',
          model: 'gemini-3.1-flash-lite',
          desc: 'Instant somatic relaxation, sensory checks, and acute stress de-escalation.'
        };
      case 'complex':
        return {
          title: 'Senior Cognitive Analyst',
          model: 'gemini-3.1-pro-preview',
          desc: 'In-depth psychological exploration, cognitive reframing, and stress trigger dissection.'
        };
      case 'general':
      default:
        return {
          title: 'Compassionate Counselor',
          model: 'gemini-3.5-flash',
          desc: 'Empathetic mental health guidance, everyday stress management, and mindful support.'
        };
    }
  };

  const currentRole = getRoleDescription();

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-4">
      {/* Top Header & Role Selector */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo size="md" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                  Gemini Mental Health Companion
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/70">
                  Multi-Turn AI
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Persistent conversation thread synced with Firebase Firestore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSyncingWithFirestore && (
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                Syncing Firestore...
              </span>
            )}
            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-rose-600 bg-stone-50 hover:bg-rose-50 border border-stone-200 rounded-xl transition-colors flex items-center gap-1.5"
              title="Clear Thread History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Task & Model Switcher Pills */}
        <div className="border-t border-stone-100 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Specialized Role & Model Architecture:
            </span>
            <div className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-xl border border-stone-200/80">
              <button
                onClick={() => setTaskType('general')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  taskType === 'general'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-teal-600" />
                <span>General (3.5 Flash)</span>
              </button>

              <button
                onClick={() => setTaskType('fast')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  taskType === 'fast'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Fast Grounding (3.1 Lite)</span>
              </button>

              <button
                onClick={() => setTaskType('complex')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  taskType === 'complex'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>In-Depth (3.1 Pro)</span>
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs text-stone-600 bg-teal-50/60 border border-teal-100 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="font-bold text-teal-900">{currentRole.title}: </span>
              <span>{currentRole.desc}</span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-teal-800 shrink-0 ml-2">
              {currentRole.model}
            </span>
          </div>
        </div>
      </div>

      {/* Main Conversation Scrollable Thread */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-6 shadow-xs min-h-[480px] max-h-[600px] flex flex-col justify-between">
        <div className="overflow-y-auto space-y-4 pr-1">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-1 px-1">
                {msg.role === 'model' ? (
                  <span className="font-semibold text-teal-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    MindEase AI
                    <span className="font-mono text-[10px] text-stone-500 font-normal">
                      ({msg.model})
                    </span>
                  </span>
                ) : (
                  <span className="font-semibold text-stone-700">You</span>
                )}
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-stone-900 text-white rounded-tr-xs shadow-xs'
                    : 'bg-stone-50 text-stone-800 border border-stone-200/80 rounded-tl-xs shadow-2xs'
                }`}
              >
                {msg.content}
              </div>

              {/* Follow-up suggestions if assistant */}
              {msg.role === 'model' && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                  {msg.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(sug)}
                      disabled={isLoading}
                      className="text-[11px] bg-teal-50/80 hover:bg-teal-100 text-teal-900 border border-teal-200/70 rounded-lg px-2.5 py-1 font-medium transition-colors text-left"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex flex-col items-start space-y-1">
              <span className="text-[11px] font-semibold text-teal-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600 animate-spin" />
                Thinking with {currentRole.model}...
              </span>
              <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl rounded-tl-xs flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-stone-100 pt-4 mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Share what you are feeling (${currentRole.title})...`}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2 px-1">
            <span>Press Enter to send • 24/7 Crisis Hotline: 6379234471</span>
            <span>Backed by Firebase Firestore & Google Gemini</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiChatView;
