import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  RotateCcw, 
  Brain, 
  Wind,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssessmentResult, ChatMessage } from '../src/types';

interface FloatingAIChatProps {
  latestAssessment?: AssessmentResult | null;
  userName?: string;
}

export const FloatingAIChat: React.FC<FloatingAIChatProps> = ({ 
  latestAssessment,
  userName = 'User'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [breathingStep, setBreathingStep] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isHighRisk = latestAssessment?.stressCategory === 'HIGH' || (latestAssessment?.stressScore ?? 0) >= 70;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      content: `Hello ${userName}. I am Mind Ease, your vocal stress identification and grounding companion. I'm here to help you understand your speech biomarkers, practice calming breathing exercises, and navigate stress relief.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: ['How does voice stress analysis work?', 'Start 4-7-8 Breathing', 'Helpline 6379234471']
    }
  ]);

  // Proactively react if an assessment changes to HIGH
  useEffect(() => {
    if (latestAssessment) {
      const score = latestAssessment.stressScore;
      const category = latestAssessment.stressCategory;
      const emotion = latestAssessment.sentimentMetrics?.primaryEmotion;

      if (category === 'HIGH') {
        setMessages((prev) => [
          ...prev,
          {
            id: `alert-${Date.now()}`,
            sender: 'assistant',
            content: `I noticed your recent assessment identified "${emotion || 'Acute Distress'}" with high vocal tension (Score: ${score}/100). Please take a slow, gentle breath with me right now. Remember, you are safe, and you are not alone.\n\nImmediate 24/7 phone support is ready at 6379234471, and an alert notification was triggered for your emergency contact. Would you like to practice a 2-minute calming grounding technique together?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: [
              'Start 4-7-8 Breathing Guide',
              'Try Physiological Sigh',
              'Call 6379234471'
            ],
            isGroundingAction: true
          }
        ]);
        setIsOpen(true);
      } else if (category === 'MEDIUM') {
        setMessages((prev) => [
          ...prev,
          {
            id: `note-${Date.now()}`,
            sender: 'assistant',
            content: `Your assessment identified "${emotion || 'Moderate Fatigue'}" with noticeable vocal strain (Score: ${score}/100). Take a brief moment to hydrate and roll your shoulders back. How are you feeling right now?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: ['Quick relaxation tip', 'Explain vocal markers']
          }
        ]);
      }
    }
  }, [latestAssessment]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    // Handle special interactive grounding triggers directly
    if (query.toLowerCase().includes('breathing') || query.toLowerCase().includes('4-7-8')) {
      triggerBreathingExercise();
      setIsLoading(false);
      return;
    }

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'assistant' ? 'model' : 'user',
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          taskType: isHighRisk ? 'fast' : 'general',
          context: {
            userName,
            stressScore: latestAssessment?.stressScore ?? null,
            stressCategory: latestAssessment?.stressCategory ?? 'UNKNOWN',
            primaryEmotion: latestAssessment?.sentimentMetrics?.primaryEmotion ?? null,
            transcript: latestAssessment?.transcript ?? '',
            acousticMetrics: latestAssessment?.acousticMetrics ?? null,
            highRisk: isHighRisk
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: data.reply || "I am right here with you. Take a slow, grounding breath.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: data.suggestions || (isHighRisk ? ['Start 4-7-8 Breathing', 'Call Helpline 6379234471'] : ['More relaxation tips', 'View vocal analysis'])
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Calming fallback in case of network issue
      const fallbackReply = isHighRisk 
        ? "I am here with you. Take a deep breath: Inhale for 4 seconds, hold for 7, exhale gently for 8. Immediate telephone support is available at 6379234471."
        : "I'm listening and here to support you. Let's focus on steady, rhythmic breathing as you review your voice assessment results.";
      
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          content: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: ['Start 4-7-8 Breathing', 'Try Physiological Sigh']
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerBreathingExercise = () => {
    setBreathingStep('Inhale deeply through your nose (4s)...');
    
    setTimeout(() => {
      setBreathingStep('Hold gently and soften your shoulders (7s)...');
      setTimeout(() => {
        setBreathingStep('Exhale slowly through your mouth (8s)...');
        setTimeout(() => {
          setBreathingStep(null);
          setMessages((prev) => [
            ...prev,
            {
              id: `breathe-end-${Date.now()}`,
              sender: 'assistant',
              content: 'Wonderful. Notice the slight release in your jaw, chest, and shoulders. You did that. Whenever you are ready, what else can I assist you with?',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              suggestions: ['Check my emergency contact', 'Explore grounding exercises']
            }
          ]);
        }, 8000);
      }, 7000);
    }, 4000);
  };

  return (
    <div className="fixed bottom-18 sm:bottom-6 right-3 sm:right-6 z-50 max-w-[calc(100vw-24px)]">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          id="open-ai-chat-btn"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 sm:gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full shadow-lg transition-all duration-300 touch-manipulation ${
            isHighRisk
              ? 'bg-[#842029] text-white ring-4 ring-red-200/80 animate-pulse'
              : 'bg-stone-800 text-white hover:bg-stone-900'
          }`}
        >
          <div className="relative">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-400 rounded-full border-2 border-stone-800"></span>
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-none">Mind Ease AI Support</div>
            <div className="text-[10px] text-stone-300 opacity-90 leading-tight">
              {isHighRisk ? 'Distress Grounding Active' : 'Voice Stress Assistant'}
            </div>
          </div>
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="floating-ai-chat-window"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : undefined
            }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`w-[calc(100vw-24px)] sm:w-[400px] max-w-md ${
              isMinimized ? 'h-auto' : 'h-[72vh] sm:h-[520px] max-h-[580px]'
            } bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden transition-all duration-200 ${
              isHighRisk ? 'ring-2 ring-red-200' : ''
            }`}
          >
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between border-b ${
              isHighRisk ? 'bg-[#F8D7DA] border-red-200' : 'bg-[#FAF9F6] border-stone-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isHighRisk ? 'bg-[#842029] text-white' : 'bg-stone-800 text-white'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-stone-900">Mind Ease AI</h3>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {isHighRisk ? 'Context: Elevated Distress Protocol' : 'Empathetic Grounding & Assistance'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 text-stone-500 hover:text-stone-800 rounded-md hover:bg-stone-200/60 transition-colors"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-stone-500 hover:text-stone-800 rounded-md hover:bg-stone-200/60 transition-colors"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body (hidden if minimized) */}
            {!isMinimized && (
              <>
                {/* Active Breathing Banner */}
                {breathingStep && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-sky-100 text-sky-900 px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b border-sky-200"
                  >
                    <Wind className="w-4 h-4 animate-spin text-sky-700" />
                    <span>{breathingStep}</span>
                  </motion.div>
                )}

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F6]/50">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-stone-800 text-white rounded-br-xs'
                            : msg.isGroundingAction
                            ? 'bg-rose-50 border border-red-200 text-stone-800 rounded-bl-xs'
                            : 'bg-white border border-stone-200/80 text-stone-800 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className={`text-[9px] mt-1 ${msg.sender === 'user' ? 'text-stone-300' : 'text-stone-400'} text-right`}>
                          {msg.timestamp}
                        </div>
                      </div>

                      {/* Suggestion Chips */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                          {msg.suggestions.map((sug, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(sug)}
                              className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-stone-300/80 text-stone-700 hover:bg-stone-100 hover:border-stone-400 transition-colors shadow-2xs"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 bg-white border border-stone-200 rounded-xl px-3 py-2 w-fit">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-stone-400" />
                      <span>Aura is reflecting gently...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <div className="p-3 bg-white border-t border-stone-200">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      id="ai-chat-input"
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={isHighRisk ? "Type 'breathe' or ask for guidance..." : "Ask Mind Ease anything..."}
                      className="flex-1 text-base sm:text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:bg-white text-stone-800 placeholder-stone-400 min-h-[44px]"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isLoading}
                      className="p-3 bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white rounded-xl transition-colors shadow-xs min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-400 px-1">
                    <span>Powered by Gemini 3.8 Flash</span>
                    <button
                      type="button"
                      onClick={triggerBreathingExercise}
                      className="text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
                    >
                      <Wind className="w-3 h-3 text-sky-600" />
                      Quick 4-7-8
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingAIChat;
