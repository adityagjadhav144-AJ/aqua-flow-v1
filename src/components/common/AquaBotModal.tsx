import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { askAquaBot, AquaBotParseResult } from '../../services/gemini';
import { db } from '../../services/db';
import { Sparkles, Send, X, Bot, Check, ArrowRight } from 'lucide-react';

interface AquaBotModalProps {
  onPreFillBooking?: (params: { volumeL?: number; purpose?: 'general' | 'drinking' }) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  result?: AquaBotParseResult;
}

export const AquaBotModal: React.FC<AquaBotModalProps> = ({ onPreFillBooking }) => {
  const { isAquaBotOpen, toggleAquaBot, t, currentLanguage } = useAppStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'bot',
      text:
        currentLanguage === 'mr'
          ? 'नमस्कार! मी अ‍ॅक्वाबॉट सहाय्यक आहे. मी टँकर बुकिंग, मनपा वेळापत्रक आणि वाजवी दरांमध्ये मदत करू शकतो. तुम्ही मराठी, हिंदी किंवा इंग्रजीत विचारू शकता.'
          : currentLanguage === 'hi'
          ? 'नमस्ते! मैं एक्वाबॉट सहायक हूँ। मैं टैंकर बुकिंग, जलापूर्ति शेड्यूल और उचित दरों में सहायता कर सकता हूँ। आप हिंदी, मराठी या अंग्रेजी में पूछ सकते हैं।'
          : 'Hello! I am AquaBot Pune. Ask me about tap water timings, book fair-price tankers, or check community pools in English, Marathi, or Hindi.',
    },
  ]);

  if (!isAquaBotOpen) return null;

  const quickPrompts = [
    t('quick_prompt_1'),
    t('quick_prompt_2'),
    t('quick_prompt_3'),
  ];

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const zones = db.getData().zones;
      const userZone = zones.find((z) => z.id === 'z2') || zones[0];
      const result = await askAquaBot(textToSend, {
        userZoneName: userZone.name,
        nextSupplyTime: 'Today 6:00 PM – 8:30 PM',
        demandIndex: userZone.demandIndex,
      });

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: result.reply,
        result,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          sender: 'bot',
          text: 'I could not process that request. Please try selecting a volume directly in the Book tab.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                <span>{t('aquabot_title')}</span>
                <span className="text-[10px] bg-cyan-400/30 px-1.5 py-0.2 rounded">Gemini AI</span>
              </div>
              <p className="text-[11px] text-cyan-100">{t('aquabot_subtitle')}</p>
            </div>
          </div>
          <button
            onClick={toggleAquaBot}
            className="p-1.5 rounded-full hover:bg-white/20 text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-white text-slate-800 rounded-bl-xs border border-slate-100 shadow-xs'
                }`}
              >
                <p>{m.text}</p>

                {/* Pre-fill Action Button if Intent is Booking */}
                {m.result?.intent === 'book_tanker' && onPreFillBooking && (
                  <button
                    onClick={() => {
                      onPreFillBooking({
                        volumeL: m.result?.volumeL,
                        purpose: m.result?.purpose,
                      });
                      toggleAquaBot();
                    }}
                    className="mt-2.5 w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
                  >
                    <span>Proceed to Book ({m.result.volumeL?.toLocaleString('en-IN')} L)</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
              <Bot size={14} className="animate-spin text-cyan-600" />
              <span>AquaBot is thinking...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 shrink-0">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] whitespace-nowrap bg-cyan-50 hover:bg-cyan-100 text-cyan-800 px-2.5 py-1 rounded-full transition-colors shrink-0 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('aquabot_placeholder')}
            className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
