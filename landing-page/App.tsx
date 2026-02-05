import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  Menu, X, Zap, BarChart3, MessageSquare,
  Calendar, Users, Shield, ArrowRight, ArrowLeft, Check,
  ChevronDown, Activity, Smartphone,
  Play, TrendingUp, Send, ArrowUp, Sun, Moon,
  Phone, Mail, MapPin,
  Facebook, Instagram, Twitter, Linkedin
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FeatureProps, PricingTier, FaqItem } from './types';

// --- Theme Context ---

const ThemeContext = createContext({
  isDark: true,
  toggleTheme: () => { },
});

const ThemeProvider = ({ children }: { children?: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => useContext(ThemeContext);

// --- Components ---

const RevealOnScroll: React.FC<{ children?: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
};

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-24 right-6 z-40 p-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-full shadow-lg text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-white hover:border-brand-500/50 transition-all duration-300 hover:scale-110 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      aria-label="Back to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};

const ChatBotWidget: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: "Hi there! 👋 I'm your AI assistant.\n\nI can help you estimate your ROI or answer questions about our pricing tiers."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = inputValue;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('https://app.brnno.io/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error}`
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had an issue processing that. Try again?'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 transition-all duration-700 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>

      {/* Chat Window */}
      <div
        className={`bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl w-[350px] max-w-[calc(100vw-3rem)] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom-right ${isOpen
          ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto'
          : 'scale-90 opacity-0 translate-y-8 pointer-events-none absolute bottom-20 right-0'
          }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse border-2 border-brand-600 absolute bottom-0 right-0"></div>
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <span className="font-bold text-sm block leading-none mb-1 text-white">BRNNO Support</span>
              <span className="text-[10px] text-brand-100 uppercase tracking-wider font-semibold">AI Agent Active</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="p-4 h-[300px] overflow-y-auto flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-950/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center font-bold text-xs shrink-0 text-white">B</div>
              )}
              <div className={`${msg.role === 'user'
                ? 'bg-brand-600 text-white rounded-2xl rounded-tr-none'
                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-300 rounded-2xl rounded-tl-none'
                } p-3 text-sm shadow-sm max-w-[80%]`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center font-bold text-xs shrink-0 text-white">B</div>
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-white/10">
          <form className="relative flex items-center gap-2" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-zinc-500 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-white disabled:opacity-50"
            />
            <button type="submit" disabled={isLoading} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-600 hover:bg-brand-500 text-white p-2 rounded-full transition-colors disabled:opacity-50">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center w-14 h-14 rounded-full shadow-[0_4px_20px_rgba(124,58,237,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rotate-90' : 'bg-gradient-to-tr from-brand-600 to-blue-600 text-white rotate-0'}`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6 fill-current" />
        )}

        {!isOpen && (
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-zinc-950"></span>
          </span>
        )}
      </button>
    </div>
  );
};

const JoinBetaModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('https://app.brnno.io/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to join waitlist');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
      setEmail('');
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setError('');
      }, 2500);
    } catch (err) {
      console.error('Waitlist error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Join BRNNO Beta</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">Be among the first to access the most powerful lead recovery platform.</p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting || isSubmitted}
            className="w-full px-4 py-3 mb-4 border border-zinc-200 dark:border-white/10 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting || isSubmitted}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitted ? 'Welcome! 🎉' : isSubmitting ? 'Joining...' : 'Get Early Access'}
          </button>
        </form>
      </div>
    </div>
  );
};

const JoinButton = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full sm:w-auto px-8 py-4 bg-white border border-zinc-200 dark:bg-white/5 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 rounded-lg text-zinc-900 dark:text-white font-semibold text-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2"
      >
        <Zap className="w-5 h-5 fill-current" />
        Join Brnno
      </button>
      <JoinBetaModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2" aria-label="BRNNO home">
          <img src="/logo.png" alt="BRNNO" className="h-24 w-auto" />
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <a href="#features" className="hover:text-brand-600 dark:hover:text-white transition-colors">Features</a>
          <a href="#roi" className="hover:text-brand-600 dark:hover:text-white transition-colors">ROI Calculator</a>
          <a href="#pricing" className="hover:text-brand-600 dark:hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-brand-600 dark:hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <a href="https://app.brnno.io/book-demo" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(0,0,0,0.2)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Book a Call
          </a>
        </div>

        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button className="text-zinc-900 dark:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4 shadow-2xl">
          <a href="#features" className="text-lg font-medium text-zinc-900 dark:text-zinc-300" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#pricing" className="text-lg font-medium text-zinc-900 dark:text-zinc-300" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <a href="#faq" className="text-lg font-medium text-zinc-900 dark:text-zinc-300" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2"></div>
          <a href="https://app.brnno.io/book-demo" className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold text-center block">Book a Call</a>
        </div>
      )}
    </nav>
  );
};

const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-brand-500 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[128px] opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">

        <RevealOnScroll>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-brand-600 dark:text-brand-300 text-xs font-semibold mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            NEW: AI Voice Assistant V2.0 Available
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={200}>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-6 leading-[1.1] text-zinc-900 dark:text-white">
            Stop Losing Jobs.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-blue-600 to-purple-600 dark:from-brand-400 dark:via-blue-400 dark:to-purple-400">
              Start Automating Revenue.
            </span>
          </h1>
        </RevealOnScroll>

        <RevealOnScroll delay={400}>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            BRNNO is the autonomous AI agent that follows up, quotes, and books appointments
            while you sleep. Zero extra effort. 100% automated.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={600}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href="https://app.brnno.io/book-demo" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-600 to-blue-600 rounded-lg text-white font-semibold text-lg hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-2 group">
              Book a Call
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <JoinButton />
          </div>
        </RevealOnScroll>

        {/* Process Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: <Zap className="w-6 h-6 text-amber-500 dark:text-amber-400 animate-pulse-scale" />,
              title: "Lead Detected",
              desc: "System identifies a missed call or form submission instantly.",
              bg: "bg-amber-500/5 dark:bg-amber-400/10",
              border: "border-amber-500/20 dark:border-amber-400/20"
            },
            {
              icon: <MessageSquare className="w-6 h-6 text-brand-500 dark:text-brand-400 animate-float" />,
              title: "AI Engages",
              desc: "AI sends a personalized SMS/Email within 30 seconds.",
              bg: "bg-brand-500/5 dark:bg-brand-400/10",
              border: "border-brand-500/20 dark:border-brand-400/20"
            },
            {
              icon: <Check className="w-6 h-6 text-emerald-500 dark:text-emerald-400 group-hover:scale-125 group-hover:rotate-6 transition-all duration-300" />,
              title: "Appointment Booked",
              desc: "Lead converts, pays deposit, and lands on your calendar.",
              bg: "bg-emerald-500/5 dark:bg-emerald-400/10",
              border: "border-emerald-500/20 dark:border-emerald-400/20"
            }
          ].map((step, idx) => (
            <RevealOnScroll key={idx} delay={800 + (idx * 200)} className="h-full">
              <div className={`relative p-6 rounded-2xl border ${step.border} ${step.bg} backdrop-blur-sm text-left group hover:-translate-y-1 transition-transform duration-300 h-full`}>
                <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center mb-4 shadow-lg border border-zinc-100 dark:border-zinc-800">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">{step.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.desc}</p>

                {/* Connector Line (Desktop) */}
                {idx !== 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 lg:-right-6 translate-y-[-50%] z-10 text-zinc-300 dark:text-zinc-600">
                    <ArrowRight className="w-6 h-6 animate-pulse" />
                  </div>
                )}
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
};

const ROICalculator: React.FC = () => {
  const [ticketSize, setTicketSize] = useState(250);
  const [missedLeads, setMissedLeads] = useState(10);
  const { isDark } = useTheme();

  // New state and ref for specific chart animation
  const [chartVisible, setChartVisible] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add a slight delay to coordinate with the container slide-up
          setTimeout(() => setChartVisible(true), 300);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const conversionRate = 0.4; // 40% recovery rate assumption
  const recoveredRevenue = Math.round(ticketSize * missedLeads * conversionRate);

  const data = [
    { name: 'Week 1', revenue: recoveredRevenue * 0.2 },
    { name: 'Week 2', revenue: recoveredRevenue * 0.5 },
    { name: 'Week 3', revenue: recoveredRevenue * 0.8 },
    { name: 'Week 4', revenue: recoveredRevenue },
  ];

  return (
    <section id="roi" className="py-24 bg-zinc-50 dark:bg-zinc-900/50 relative border-y border-zinc-200 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <RevealOnScroll>
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-zinc-900 dark:text-white">
                Calculate Your <span className="text-brand-600 dark:text-brand-400">Lost Revenue</span>
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-lg">
                Most service businesses miss 20-30% of calls. See how much BRNNO could add to your bottom line in just 30 days.
              </p>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Average Job Value</label>
                    <span className="text-brand-600 dark:text-brand-400 font-bold">${ticketSize}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={ticketSize}
                    onChange={(e) => setTicketSize(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Missed Leads Per Month</label>
                    <span className="text-brand-600 dark:text-brand-400 font-bold">{missedLeads} leads</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={missedLeads}
                    onChange={(e) => setMissedLeads(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>
              </div>

              <div className="mt-8 p-6 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-500/20 rounded-xl">
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Potential Monthly Recovery</p>
                <p className="text-4xl font-bold text-brand-900 dark:text-white">${recoveredRevenue.toLocaleString()}</p>
                <p className="text-xs text-brand-600 dark:text-brand-300 mt-2">*Based on conservative 40% AI recovery rate</p>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <div ref={chartRef} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl h-80 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
                <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
                Projected Growth
              </h3>
              <div className="flex-1 w-full min-h-0">
                {chartVisible && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e4e4e7"} vertical={false} />
                      <XAxis dataKey="name" stroke={isDark ? "#52525b" : "#a1a1aa"} fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke={isDark ? "#52525b" : "#a1a1aa"} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#18181b' : '#ffffff',
                          border: isDark ? '1px solid #27272a' : '1px solid #e4e4e7',
                          borderRadius: '8px',
                          color: isDark ? '#ffffff' : '#09090b',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: isDark ? '#fff' : '#09090b' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
};

const BentoGridFeatures: React.FC = () => {
  const features: FeatureProps[] = [
    {
      title: "Recovery Command Center",
      description: "Recover lost revenue with our powerful 3-panel command center. Track hot, warm, and cold leads instantly.",
      icon: <BarChart3 className="w-6 h-6 text-blue-500 dark:text-blue-400" />,
      span: "md:col-span-2"
    },
    {
      title: "AI Auto Follow-Up",
      description: "Multi-step SMS & Email sequences that feel human. Stop chasing ghosts.",
      icon: <MessageSquare className="w-6 h-6 text-purple-500 dark:text-purple-400" />,
      span: "md:col-span-1"
    },
    {
      title: "Smart Scheduling",
      description: "Allow customers to book directly into your calendar based on real-time team availability.",
      icon: <Calendar className="w-6 h-6 text-pink-500 dark:text-pink-400" />,
      span: "md:col-span-1"
    },
    {
      title: "Services & Add-ons",
      description: "Upsell automatically during the booking flow. Increase average ticket value by 20%.",
      icon: <Zap className="w-6 h-6 text-amber-500 dark:text-amber-400" />,
      span: "md:col-span-1"
    },
    {
      title: "Customer CRM",
      description: "Track customer history, LTV, and VIP status. Build lasting relationships automatically.",
      icon: <Users className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />,
      span: "md:col-span-1"
    },
  ];

  return (
    <section id="features" className="py-24 max-w-7xl mx-auto px-6">
      <RevealOnScroll>
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 text-zinc-900 dark:text-white">Everything You Need To Grow</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
            Powerful lead recovery tools, automation, and business management all in one modern platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className={`p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 hover:border-brand-500/30 transition-all duration-300 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] group ${feature.span || ''}`}>
              <div className="w-12 h-12 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">{feature.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </RevealOnScroll>
    </section>
  );
};

const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans: PricingTier[] = [
    {
      name: "Starter",
      price: 89,
      yearlyPrice: 74,
      description: "Perfect for solo detailers just starting to automate.",
      features: [
        { text: "24/7 Online Booking Portal", tooltip: "Accept appointments round the clock with your custom branded booking page." },
        { text: "Smart Calendar Views", tooltip: "Daily, weekly, and monthly calendar views to visualize your entire schedule." },
        { text: "20 AI Lead Recoveries/mo", tooltip: "Automatically follow up with up to 20 missed calls per month via SMS." },
        { text: "Customer Database", tooltip: "Store customer contact details, vehicle info, and complete job history." },
        { text: "Email Support", tooltip: "Get help via email Monday-Friday during business hours." }
      ],
    },
    {
      name: "Pro",
      price: 169,
      yearlyPrice: 141,
      description: "Built for growing shops ready to scale revenue.",
      features: [
        { text: "Everything in Starter", tooltip: "Includes all features from the Starter plan." },
        { text: "Unlimited Lead Recovery", tooltip: "Never miss a potential customer - unlimited automated SMS follow-ups for missed calls." },
        { text: "Multi-Channel AI Sequences", tooltip: "Smart SMS & Email drip campaigns that nurture leads until they book." },
        { text: "Full Marketing Automation", tooltip: "Automated booking confirmations, appointment reminders, and post-service review requests." },
        { text: "Revenue & Conversion Analytics", tooltip: "Track which lead sources convert best, monthly revenue trends, and customer lifetime value." },
        { text: "Conflict-Free Scheduling", tooltip: "AI detects double-bookings and optimizes your daily route automatically." }
      ],
      isPopular: true,
      highlightColor: "border-brand-500"
    },
    {
      name: "Fleet",
      price: 299,
      yearlyPrice: 249,
      description: "Enterprise tools for multi-vehicle operations.",
      features: [
        { text: "Everything in Pro", tooltip: "Includes all features from the Pro plan." },
        { text: "White-Glove Onboarding", tooltip: "Dedicated setup call + 24/7 priority support via phone, chat, and email." },
        { text: "Team Performance Dashboards", tooltip: "Track revenue, efficiency, and customer satisfaction per technician or vehicle." },
        { text: "Advanced Team Management", tooltip: "Role-based permissions, staff scheduling, and territory assignment tools." },
        { text: "AI Voice Agent (50 calls/mo)", tooltip: "Conversational AI answers incoming calls, quotes jobs, and books appointments when you're busy." },
        { text: "Custom Integrations & API", tooltip: "Connect BRNNO with QuickBooks, existing CRMs, or dispatch software via our REST API." },
        {
          text: "Dedicated Account Manager",
          tooltip: "Your personal success coach helps optimize workflows and maximize ROI.",
          icon: <Activity className="w-4 h-4 text-brand-600 dark:text-brand-500" />
        }
      ],
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-zinc-50 dark:bg-zinc-950 relative transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 mix-blend-soft-light dark:mix-blend-normal"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10 overflow-visible">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 text-zinc-900 dark:text-white">Simple, Transparent Pricing</h2>

            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-14 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full p-1 relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-zinc-50 dark:focus:ring-offset-zinc-950"
              >
                <div className={`w-6 h-6 bg-brand-600 dark:bg-brand-500 rounded-full shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Yearly <span className="text-brand-600 dark:text-brand-400 text-xs ml-1">(Save 20%)</span></span>
            </div>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start overflow-visible">
          {plans.map((plan, i) => (
            <RevealOnScroll key={i} delay={i * 100} className={`h-full overflow-visible ${plan.isPopular ? 'z-10' : ''}`}>
              <div
                className={`relative p-8 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border transition-all duration-300 flex flex-col h-full group overflow-visible
                  ${plan.isPopular
                    ? 'border-brand-500 shadow-[0_0_40px_rgba(139,92,246,0.15)] scale-105 hover:scale-[1.08] hover:shadow-[0_0_80px_rgba(139,92,246,0.3)]'
                    : 'border-zinc-200 dark:border-white/5 hover:border-brand-500/20 hover:shadow-xl hover:scale-[1.02] hover:bg-white/90 dark:hover:bg-zinc-900/90'}
                `}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">{plan.name}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm h-10">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-white">${isAnnual ? plan.yearlyPrice : plan.price}</span>
                  <span className="text-zinc-500">/mo</span>
                  {isAnnual && <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">Billed annually</p>}
                </div>

                <a href="https://app.brnno.io/book-demo" className={`w-full py-3 rounded-lg font-semibold mb-8 transition-colors block text-center
                  ${plan.isPopular ? 'bg-brand-600 hover:bg-brand-700 text-white' : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'}
                `}>
                  Book a Call
                </a>

                <div className="space-y-4 flex-1 overflow-visible">
                  <p className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Core Features</p>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 group relative overflow-visible">
                      {feat.icon ? (
                        <div className="mt-0.5 shrink-0">{feat.icon}</div>
                      ) : (
                        <Check className="w-4 h-4 text-brand-600 dark:text-brand-500 mt-0.5 shrink-0" />
                      )}
                      <span className="border-b border-zinc-300 dark:border-zinc-700 border-dashed cursor-help">{feat.text}</span>

                      {/* Tooltip - wider, wraps text, escapes card via overflow-visible */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[12rem] max-w-[18rem] w-max p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out scale-95 translate-y-2 group-hover:scale-100 group-hover:translate-y-0 z-[100] pointer-events-none text-xs text-left text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-normal">
                        <span className="block max-h-32 overflow-y-auto">{feat.tooltip}</span>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-zinc-800"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* General Book a Call CTA */}
        <RevealOnScroll delay={400}>
          <div className="mt-20 p-8 md:p-12 bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-white/5 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50"></div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              Not sure which plan is right for you?
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-xl mx-auto">
              Talk to our automation experts. We'll analyze your current lead flow and recommend the perfect setup for your business.
            </p>
            <a href="https://app.brnno.io/book-demo" className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2 mx-auto w-fit">
              Book a Call
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: "How quickly can I get started with BRNNO?",
      answer: "Most businesses are fully operational within 24 hours. We handle help with the technical setup, We'll help you configure your booking page. You just need to provide basic business info and description."
    },
    {
      question: "Do I have to use AI add-ons?",
      answer: 'No — all AI tools are optional. You can start with the core plan and add AI features only if and when they make sense for your business.',
    },
    {
      question: 'Can I switch plans later?',
      answer: 'Absolutely. You can upgrade or downgrade at any time, and your billing will adjust automatically.',
    },
    {
      question: "Do you offer a free trial?",
      answer: "We offer a 14-day free trial. This lets you use the full system with real leads, see actual results, and if it's not a fit, you can cancel anytime, no questions asked."
    },
    {
      question: "How does lead recovery actually work?",
      answer: "When a booking isn't finished, BRNNO instantly sends a personalized SMS to that number or email. If they don't respond, it follows up with a sequence of messages over the next few days. The AI answers their questions, provides quotes, and books them directly into your calendar—all automatically."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes. No long-term contracts. Cancel with one click from your dashboard. We believe the software should earn your business every single month."
    },
  ];

  return (
    <section id="faq" className="py-24 max-w-3xl mx-auto px-6">
      <RevealOnScroll>
        <h2 className="text-3xl font-display font-bold mb-12 text-center text-zinc-900 dark:text-white">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-zinc-200 dark:border-white/10 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden transition-colors">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <span className="font-medium text-lg text-zinc-900 dark:text-white">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              <div className={`px-6 text-zinc-600 dark:text-zinc-400 leading-relaxed overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </RevealOnScroll>
    </section>
  );
};

// --- Legal Pages (brought over from Next.js app) ---

const PrivacyContent: React.FC = () => (
  <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-900 dark:text-white">
    <h1 className="text-4xl font-bold mb-4 text-zinc-900 dark:text-white">Privacy Policy</h1>
    <p className="text-zinc-600 dark:text-zinc-400 mb-8">
      Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">1. Introduction</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        BRNNO ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service management platform.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">2. Information We Collect</h2>
      <h3 className="text-xl font-semibold mb-2 text-zinc-300">2.1 Information You Provide</h3>
      <ul className="list-disc pl-6 mb-4 text-zinc-400">
        <li>Account information (name, email, phone number)</li>
        <li>Business information (business name, address, service area)</li>
        <li>Payment information (processed securely through Stripe)</li>
        <li>Customer and job data you input into the platform</li>
      </ul>
      <h3 className="text-xl font-semibold mb-2 text-zinc-700 dark:text-zinc-300">2.2 Automatically Collected Information</h3>
      <ul className="list-disc pl-6 mb-4 text-zinc-600 dark:text-zinc-400">
        <li>Device information and IP address</li>
        <li>Usage data and analytics</li>
        <li>Cookies and similar tracking technologies</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">3. How We Use Your Information</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">We use the information we collect to:</p>
      <ul className="list-disc pl-6 mb-4 text-zinc-600 dark:text-zinc-400">
        <li>Provide, maintain, and improve our services</li>
        <li>Process transactions and send related information</li>
        <li>Send administrative information and updates</li>
        <li>Respond to your inquiries and provide customer support</li>
        <li>Monitor and analyze usage patterns</li>
        <li>Detect, prevent, and address technical issues</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">4. Information Sharing and Disclosure</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        We do not sell your personal information. We may share your information only in the following circumstances:
      </p>
      <ul className="list-disc pl-6 mb-4 text-zinc-600 dark:text-zinc-400">
        <li>With service providers who assist in operating our platform (e.g., payment processors, hosting providers)</li>
        <li>When required by law or to protect our rights</li>
        <li>In connection with a business transfer or merger</li>
        <li>With your explicit consent</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">5. Data Security</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">6. Your Rights</h2>
      <p className="text-zinc-400 mb-4">Depending on your location, you may have the right to:</p>
      <ul className="list-disc pl-6 mb-4 text-zinc-400">
        <li>Access your personal information</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Object to processing of your data</li>
        <li>Data portability</li>
        <li>Withdraw consent</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">7. Cookies</h2>
      <p className="text-zinc-400 mb-4">
        We use cookies and similar technologies to enhance your experience, analyze usage, and assist in marketing efforts. You can control cookies through your browser settings.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">8. Children's Privacy</h2>
      <p className="text-zinc-400 mb-4">
        Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">9. Changes to This Privacy Policy</h2>
      <p className="text-zinc-400 mb-4">
        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">10. Contact Us</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">If you have questions about this Privacy Policy, please contact us at:</p>
      <div className="bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 p-4 rounded-lg">
        <p className="text-zinc-600 dark:text-zinc-400">
          <strong className="text-zinc-700 dark:text-zinc-300">Email:</strong> <a href="mailto:privacy@brnno.com" className="text-brand-400 hover:underline">privacy@brnno.com</a><br />
          <strong className="text-zinc-700 dark:text-zinc-300">Phone:</strong> <a href="tel:+18016137887" className="text-brand-400 hover:underline">(801) 613-7887</a><br />
          <strong className="text-zinc-700 dark:text-zinc-300">Address:</strong> 7533 S Center View CT # 4801, West Jordan, UT 84084
        </p>
      </div>
    </section>
  </div>
);

const TermsContent: React.FC = () => (
  <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-900 dark:text-white">
    <h1 className="text-4xl font-bold mb-4 text-zinc-900 dark:text-white">Terms of Service</h1>
    <p className="text-zinc-600 dark:text-zinc-400 mb-8">
      Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">1. Agreement to Terms</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        By accessing or using BRNNO's service management platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">2. Use License</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        Permission is granted to temporarily use BRNNO for your business operations. This license is for use only and does not include:
      </p>
      <ul className="list-disc pl-6 mb-4 text-zinc-600 dark:text-zinc-400">
        <li>Modifying or copying the software</li>
        <li>Using the Service for any commercial purpose other than your own business</li>
        <li>Attempting to reverse engineer or extract source code</li>
        <li>Removing copyright or proprietary notations</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">3. Account Registration</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">To access certain features, you must register for an account. You agree to:</p>
      <ul className="list-disc pl-6 mb-4 text-zinc-600 dark:text-zinc-400">
        <li>Provide accurate, current, and complete information</li>
        <li>Maintain and update your information as necessary</li>
        <li>Maintain the security of your password</li>
        <li>Accept responsibility for all activities under your account</li>
        <li>Notify us immediately of any unauthorized use</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">4. Subscription and Payment</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">Our Service is offered on a subscription basis. By subscribing, you agree to:</p>
      <ul className="list-disc pl-6 mb-4 text-zinc-600 dark:text-zinc-400">
        <li>Pay all fees associated with your subscription</li>
        <li>Automatic renewal unless cancelled</li>
        <li>No refunds for partial subscription periods</li>
        <li>Price changes with 30 days notice</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">5. User Content</h2>
      <p className="text-zinc-400 mb-4">
        You retain ownership of all data and content you upload to the Service. By using the Service, you grant us a license to use, store, and process your content solely to provide the Service.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">6. Prohibited Uses</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">You may not use the Service:</p>
      <ul className="list-disc pl-6 mb-4 text-zinc-600 dark:text-zinc-400">
        <li>For any unlawful purpose</li>
        <li>To violate any laws or regulations</li>
        <li>To transmit harmful code or malware</li>
        <li>To interfere with or disrupt the Service</li>
        <li>To impersonate any person or entity</li>
        <li>To collect or track personal information of others</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">7. Service Availability</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue the Service at any time with or without notice.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">8. Intellectual Property</h2>
      <p className="text-zinc-400 mb-4">
        The Service and its original content, features, and functionality are owned by BRNNO and are protected by international copyright, trademark, and other intellectual property laws.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">9. Limitation of Liability</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        In no event shall BRNNO be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data loss, or business interruption, arising out of or relating to your use of the Service.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">10. Indemnification</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        You agree to indemnify and hold harmless BRNNO from any claims, damages, losses, liabilities, and expenses arising from your use of the Service or violation of these Terms.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">11. Termination</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">12. Changes to Terms</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        We reserve the right to modify these Terms at any time. We will notify users of any material changes. Your continued use of the Service after changes constitutes acceptance.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">13. Contact Information</h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">Questions about these Terms? Contact us at:</p>
      <div className="bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 p-4 rounded-lg">
        <p className="text-zinc-600 dark:text-zinc-400">
          <strong className="text-zinc-700 dark:text-zinc-300">Email:</strong> <a href="mailto:legal@brnno.com" className="text-brand-400 hover:underline">legal@brnno.com</a><br />
          <strong className="text-zinc-700 dark:text-zinc-300">Phone:</strong> <a href="tel:+18016137887" className="text-brand-400 hover:underline">(801) 613-7887</a><br />
          <strong className="text-zinc-700 dark:text-zinc-300">Address:</strong> 7533 S Center View CT # 4801, West Jordan, UT 84084
        </p>
      </div>
    </section>
  </div>
);

// --- About Us (brought over from Next.js app/about) ---

const AboutUsContent: React.FC = () => (
  <div className="space-y-16 text-zinc-900 dark:text-white">
    {/* Hero */}
    <section className="text-center">
      <h1 className="text-4xl font-bold mb-4 text-zinc-900 dark:text-white">About BRNNO</h1>
      <p className="text-xl text-zinc-600 dark:text-zinc-400">
        Empowering service businesses with the tools they need to succeed
      </p>
    </section>

    {/* Mission */}
    <section className="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white">Our Mission</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-lg leading-relaxed">
          At BRNNO, we believe that service-based businesses deserve powerful, intuitive tools to manage their operations. We're on a mission to simplify business management so you can focus on what you do best—serving your customers.
        </p>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
          Whether you're a mobile detailing service, a cleaning company, or any other service business, BRNNO provides everything you need to streamline scheduling, manage customers, track jobs, and grow your business.
        </p>
      </div>
      <div className="bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-lg aspect-square flex items-center justify-center">
        <span className="text-zinc-500 dark:text-zinc-500">Team Photo Placeholder</span>
      </div>
    </section>

    {/* Values */}
    <section>
      <h2 className="text-3xl font-bold text-center mb-12 text-zinc-900 dark:text-white">Our Values</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 p-6 rounded-lg">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Simplicity</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            We believe powerful tools should be easy to use. No complicated setups, no steep learning curves.
          </p>
        </div>
        <div className="bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 p-6 rounded-lg">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Reliability</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Your business depends on us, so we're committed to providing a stable, secure platform you can count on.
          </p>
        </div>
        <div className="bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 p-6 rounded-lg">
          <div className="text-4xl mb-4">💡</div>
          <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Innovation</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            We're constantly improving and adding new features based on feedback from businesses like yours.
          </p>
        </div>
      </div>
    </section>

    {/* Team */}
    <section>
      <h2 className="text-3xl font-bold text-center mb-12 text-zinc-900 dark:text-white">Our Team</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-full w-32 h-32 mx-auto mb-4 flex items-center justify-center">
            <span className="text-zinc-500">Photo</span>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Adrian Smithee</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">co-founder & CEO</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Adrian has nearly 20 years of sales leadership with a deep focus on helping service businesses win more work.
          </p>
        </div>
        <div className="text-center">
          <div className="bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-full w-32 h-32 mx-auto mb-4 flex items-center justify-center">
            <span className="text-zinc-500">Photo</span>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Johnathan Jake</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">co-founder & CTO</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Johnathan leads our technical team, ensuring BRNNO stays ahead of the curve with cutting-edge technology.
          </p>
        </div>
        <div className="text-center">
          <div className="bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-full w-32 h-32 mx-auto mb-4 flex items-center justify-center">
            <span className="text-zinc-500">Photo</span>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Sam Christmas</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">co-founder & CFO</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Sam ensures every customer gets the support they need to succeed with BRNNO.
          </p>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="bg-gradient-to-r from-brand-600 to-blue-600 text-white py-16 rounded-2xl text-center">
      <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
      <p className="text-xl mb-8 opacity-90">
        Join hundreds of service businesses using BRNNO to streamline their operations.
      </p>
      <a
        href="https://app.brnno.io/signup"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-white text-brand-600 px-8 py-3 rounded-lg font-semibold hover:bg-zinc-100 transition-colors"
      >
        Get Started
      </a>
    </section>
  </div>
);

// --- Contact (brought over from Next.js app/contact) ---

const ContactContent: React.FC = () => {
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value || '';
    const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value || '';
    const phone = (form.querySelector('[name="phone"]') as HTMLInputElement)?.value || '';
    const interested_plan = (form.querySelector('[name="interested_plan"]') as HTMLSelectElement)?.value || '';
    const message = (form.querySelector('[name="message"]') as HTMLTextAreaElement)?.value || '';
    const subject = `Contact from ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : '',
      interested_plan ? `Interested in: ${interested_plan}` : '',
      '',
      'Message:',
      message
    ].filter(Boolean).join('\n');
    const mailto = `mailto:support@brnno.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setSuccess(true);
    form.reset();
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <div className="space-y-12 text-zinc-900 dark:text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-zinc-900 dark:text-white">Get in Touch</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          Have questions? Don't hesitate to reach out. We're here to help.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-zinc-900 dark:text-white">Contact Information</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Phone className="h-6 w-6 text-brand-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1 text-zinc-900 dark:text-white">Phone</h3>
                <a href="tel:+18016137887" className="text-brand-400 hover:underline">(801) 613-7887</a>
                <p className="text-sm text-zinc-500 mt-1">Mon-Fri, 9am-5pm MST</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-brand-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1 text-zinc-900 dark:text-white">Email</h3>
                <a href="mailto:support@brnno.com" className="text-brand-400 hover:underline">support@brnno.com</a>
                <p className="text-sm text-zinc-500 mt-1">We typically respond within 24 hours</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-brand-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1 text-zinc-900 dark:text-white">Address</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  7533 S Center View CT # 4801<br />
                  West Jordan, UT 84084
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl p-8">
          {success && (
            <div className="mb-6 rounded-lg bg-green-500/20 border border-green-500/40 p-4">
              <p className="text-green-800 dark:text-green-200 font-semibold">✓ Your email client will open with your message. Send it to reach us.</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name *</label>
                <input id="contact-name" name="name" required placeholder="John Doe" className="w-full rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email *</label>
                <input id="contact-email" name="email" type="email" required placeholder="john@example.com" className="w-full rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Phone (Optional)</label>
                <input id="contact-phone" name="phone" type="tel" placeholder="(555) 123-4567" className="w-full rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label htmlFor="contact-plan" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Interested In</label>
                <select id="contact-plan" name="interested_plan" className="w-full rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select a plan...</option>
                  <option value="starter">Starter - $59/month</option>
                  <option value="professional">Professional - $149/month</option>
                  <option value="business">Business - $249/month</option>
                  <option value="custom">Custom / À La Carte</option>
                  <option value="not_sure">Not sure yet</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Message *</label>
              <textarea id="contact-message" name="message" required placeholder="Tell us how we can help..." rows={6} className="w-full rounded-md border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4 transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-zinc-950 dark:bg-black text-white pt-20 pb-8">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="BRNNO" className="h-24 w-auto" />
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              AI-powered business automation platform for service-based businesses. Never miss a lead again.
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/share/17dT73gNAu/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-brand-600 hover:border-brand-500 transition-all duration-300" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/getbrnno" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-brand-600 hover:border-brand-500 transition-all duration-300" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://x.com/JohnJake228812" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-brand-600 hover:border-brand-500 transition-all duration-300" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com/company/brnno" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-brand-600 hover:border-brand-500 transition-all duration-300" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-zinc-400 hover:text-white transition-colors text-sm">Features</a></li>
              <li><a href="#roi" className="text-zinc-400 hover:text-white transition-colors text-sm">ROI Calculator</a></li>
              <li><a href="#pricing" className="text-zinc-400 hover:text-white transition-colors text-sm">Pricing</a></li>
              <li><a href="https://app.brnno.io/book-demo" className="text-zinc-400 hover:text-white transition-colors text-sm">Book Demo</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              <li><a href="#about" className="text-zinc-400 hover:text-white transition-colors text-sm">About Us</a></li>
              <li>
                <a href="https://g.page/r/CVPJkZDVH3EgEAE/review" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  Google Business
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-3">
              <li><a href="#contact" className="text-zinc-400 hover:text-white transition-colors text-sm">Contact</a></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#privacy" className="text-zinc-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#terms" className="text-zinc-400 hover:text-white transition-colors text-sm">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} BRNNO Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#privacy" className="text-zinc-500 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" className="text-zinc-500 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-zinc-500 hover:text-white transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Main App Component ---

const AppContent: React.FC<{ mainOverride?: React.ReactNode }> = ({ mainOverride }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white selection:bg-brand-500/30 transition-colors duration-300">
      <Navbar />
      <main>
        {mainOverride ? (
          <div className="max-w-4xl mx-auto px-6 py-16 bg-zinc-100 dark:bg-zinc-950 min-h-[60vh]">
            <a
              href="#"
              className="inline-flex items-center gap-2 py-2 pr-3 pl-1 -ml-1 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-10 relative z-10 rounded-md hover:bg-zinc-200/50 dark:hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              Back to home
            </a>
            {mainOverride}
          </div>
        ) : (
          <>
            <HeroSection />
            <ROICalculator />
            <BentoGridFeatures />
            <Pricing />
            <FAQ />
          </>
        )}
      </main>
      <Footer />
      <BackToTop />
      <ChatBotWidget />
    </div>
  );
};

function getPageFromHash(): 'main' | 'privacy' | 'terms' | 'about' | 'contact' {
  const h = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
  if (h === 'privacy') return 'privacy';
  if (h === 'terms') return 'terms';
  if (h === 'about') return 'about';
  if (h === 'contact') return 'contact';
  return 'main';
}

const App: React.FC = () => {
  const [page, setPage] = useState<'main' | 'privacy' | 'terms' | 'about' | 'contact'>(() => getPageFromHash());

  useEffect(() => {
    const onHash = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Scroll to top when navigating to a sub-page (About, Contact, Privacy, Terms)
  useEffect(() => {
    if (page !== 'main') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  const mainOverride =
    page === 'privacy' ? <PrivacyContent /> :
    page === 'terms' ? <TermsContent /> :
    page === 'about' ? <AboutUsContent /> :
    page === 'contact' ? <ContactContent /> : undefined;

  return (
    <ThemeProvider>
      <AppContent mainOverride={mainOverride} />
    </ThemeProvider>
  );
};

export default App;