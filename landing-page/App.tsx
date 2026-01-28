import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  Menu, X, Zap, BarChart3, MessageSquare,
  Calendar, Users, Shield, ArrowRight, Check,
  ChevronDown, Activity, Smartphone,
  Play, TrendingUp, Send, ArrowUp, Sun, Moon
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

  useEffect(() => {
    // Slide in after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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

        {/* Body */}
        <div className="p-4 h-[300px] overflow-y-auto flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-950/50">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center font-bold text-xs shrink-0 text-white">B</div>
            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 p-3 rounded-2xl rounded-tl-none text-sm text-zinc-600 dark:text-zinc-300 shadow-sm">
              <p>Hi there! 👋 I'm your AI assistant.</p>
              <p className="mt-2">I can help you estimate your ROI or answer questions about our pricing tiers.</p>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-white/10">
          <form className="relative flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Ask me anything..."
              className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-zinc-500 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-white"
            />
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-600 hover:bg-brand-500 text-white p-2 rounded-full transition-colors">
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

        {/* Notification Dot */}
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-600 to-blue-500 rounded-lg flex items-center justify-center font-bold text-white">B</div>
          <span className="font-display font-bold text-xl tracking-tight text-zinc-900 dark:text-white">BRNNO</span>
        </div>

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
          <button className="text-zinc-600 dark:text-zinc-300 hover:text-brand-600 dark:hover:text-white font-medium text-sm transition-colors">Sign In</button>
          <a href="http://localhost:3000/book-demo" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(0,0,0,0.2)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
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
          <a href="http://localhost:3000/book-demo" className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold text-center block">Book a Call</a>
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
            <a href="http://localhost:3000/book-demo" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-600 to-blue-600 rounded-lg text-white font-semibold text-lg hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-2 group">
              Book a Call
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <button className="w-full sm:w-auto px-8 py-4 bg-white border border-zinc-200 dark:bg-white/5 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 rounded-lg text-zinc-900 dark:text-white font-semibold text-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 fill-current" />
              Join Brnno
            </button>
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
      description: "For solo operators getting organized.",
      features: [
        { text: "Instant Booking Portal", tooltip: "Accept appointments 24/7 with a custom branded booking page." },
        { text: "Basic Job Views", tooltip: "Daily, weekly, and monthly calendar views to manage your schedule." },
        { text: "Lead Recovery (20/mo)", tooltip: "Automatically follow up with up to 20 missed calls per month." },
        { text: "Basic CRM", tooltip: "Store customer contact details and job history in one place." },
        { text: "No Automation", tooltip: "Manual control for sending messages and reminders." }
      ],
    },
    {
      name: "Pro",
      price: 169,
      yearlyPrice: 141,
      description: "For growing teams needing automation.",
      features: [
        { text: "Everything in Starter", tooltip: "Includes all features from the Starter plan." },
        { text: "Unlimited Lead Recovery", tooltip: "Never miss a lead with unlimited automated call-back sequences." },
        { text: "AI Follow-Up Sequences", tooltip: "Smart SMS & Email campaigns to nurture leads automatically." },
        { text: "Full Automation Suite", tooltip: "Automated booking confirmations, reminders, and review requests." },
        { text: "Advanced Reporting", tooltip: "Detailed insights on revenue, conversion rates, and lead sources." },
        { text: "Smart Scheduling", tooltip: "Intelligent routing and conflict detection to optimize your day." }
      ],
      isPopular: true,
      highlightColor: "border-brand-500"
    },
    {
      name: "Fleet",
      price: 299,
      yearlyPrice: 249,
      description: "For multi-vehicle operations.",
      features: [
        { text: "Everything in Pro", tooltip: "Includes all features from the Pro plan." },
        { text: "Priority Support", tooltip: "Skip the line with 24/7 dedicated priority support access." },
        { text: "Performance Analytics", tooltip: "Track revenue and efficiency per team member or vehicle." },
        { text: "Team Management", tooltip: "Advanced role-based permissions and staff scheduling tools." },
        { text: "AI Voice Agent Included", tooltip: "Conversational AI answers calls and books jobs when you can't." },
        { text: "API Access", tooltip: "Connect BRNNO with your existing accounting or dispatch software." },
        {
          text: "AI Appointment Booking",
          tooltip: "AI answers calls and books jobs when you can't.",
          icon: <Play className="w-4 h-4 text-brand-600 dark:text-brand-500 fill-current" />
        }
      ],
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-zinc-50 dark:bg-zinc-950 relative transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 mix-blend-soft-light dark:mix-blend-normal"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <RevealOnScroll key={i} delay={i * 100} className={`h-full ${plan.isPopular ? 'z-10' : ''}`}>
              <div
                className={`relative p-8 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border transition-all duration-300 flex flex-col h-full group
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

                <button className={`w-full py-3 rounded-lg font-semibold mb-8 transition-colors
                  ${plan.isPopular ? 'bg-brand-600 hover:bg-brand-700 text-white' : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'}
                `}>
                  Book a Call
                </button>

                <div className="space-y-4 flex-1">
                  <p className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Core Features</p>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 group relative">
                      {feat.icon ? (
                        <div className="mt-0.5 shrink-0">{feat.icon}</div>
                      ) : (
                        <Check className="w-4 h-4 text-brand-600 dark:text-brand-500 mt-0.5 shrink-0" />
                      )}
                      <span className="border-b border-zinc-300 dark:border-zinc-700 border-dashed cursor-help">{feat.text}</span>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out transform scale-95 opacity-0 translate-y-2 group-hover:scale-100 group-hover:translate-y-0 z-50 pointer-events-none text-xs text-center text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {feat.tooltip}
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
            <button className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2 mx-auto">
              Book a Call
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    { question: "Do I need to be tech-savvy?", answer: "Not at all. We set up your account for you, and the dashboard is designed to be as simple as email." },
    { question: "Can I use my own phone number?", answer: "Yes, we provision a dedicated local business line for the AI, or we can forward calls from your existing number." },
    { question: "What if the AI makes a mistake?", answer: "You can take over any conversation at any time. The AI is trained to hand off to a human for complex queries." },
    { question: "Is there a contract?", answer: "No contracts. Cancel anytime. We believe the product should earn your business every month." },
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

const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-white/5 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center font-bold text-white text-xs">B</div>
              <span className="font-bold text-lg text-zinc-900 dark:text-white">BRNNO</span>
            </div>
            <p className="text-zinc-500 max-w-sm mb-6">
              The all-in-one business management platform built for service-based businesses. Recover leads, automate bookings, and scale faster.
            </p>
            <div className="flex gap-4">
              {/* Social Links */}
              <a href="#" className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-brand-600 transition-all duration-300 shadow-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-brand-600 transition-all duration-300 shadow-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-zinc-900 dark:text-white">Product</h4>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400 text-sm">
              <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Changelog</a></li>
              <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-zinc-900 dark:text-white">Legal</h4>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400 text-sm">
              <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Security</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-zinc-900 dark:text-white">Contact Us</h4>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400 text-sm">
              <li><a href="mailto:contact@brnno.io" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">contact@brnno.io</a></li>
              <li><a href="tel:+18016137887" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">+1 (801) 613-7887</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-white/5 pt-8 text-center text-zinc-600 text-sm">
          &copy; 2024 BRNNO Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

// --- Main App Component ---

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white selection:bg-brand-500/30 transition-colors duration-300">
      <Navbar />
      <main>
        <HeroSection />
        <ROICalculator />
        <BentoGridFeatures />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
      <BackToTop />
      <ChatBotWidget />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;