import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';
import AzureTranslate from '../components/AzureTranslate';

// The 4 Preserved High-Quality Agricultural Images
import cardCropImg from '../assets/card-crop.jpg';
import cardDiseaseImg from '../assets/card-disease.jpg';
import cardWeatherImg from '../assets/card-weather.jpg';
import cardMarketImg from '../assets/card-market.jpg';

// Cinematic Agricultural Backgrounds
import heroImg from '../assets/hero-landscape.jpg';
import ctaImg from '../assets/cta-landscape.jpg';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleExplore = () => {
    navigate(isAuthenticated ? '/' : '/recommend');
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 4 Preserved Feature Cards
  const solutions = [
    {
      title: 'Crop Intelligence',
      desc: 'Soil and climate-aware crop recommendations.',
      image: cardCropImg,
      route: '/recommend',
      cta: 'Explore Advisory',
    },
    {
      title: 'Disease Detection',
      desc: 'Leaf image analysis and disease identification.',
      image: cardDiseaseImg,
      route: '/disease',
      cta: 'Scan Leaf',
    },
    {
      title: 'Weather & Alerts',
      desc: 'Weather forecasts and agricultural alerts.',
      image: cardWeatherImg,
      route: '/weather',
      cta: 'View Weather',
    },
    {
      title: 'Market & Yield Insights',
      desc: 'Market prices, yield predictions, and profit planning.',
      image: cardMarketImg,
      route: '/market',
      cta: 'Check Prices',
    },
  ];

  // 4 Clear How-It-Works Steps (Arranged Horizontally on Desktop)
  const steps = [
    {
      number: '01',
      title: 'Enter location and soil information.',
      desc: 'Specify your state, district, and soil profile, or auto-detect current coordinates and nutrient readings.',
    },
    {
      number: '02',
      title: 'Analyse agricultural conditions.',
      desc: 'The platform evaluates live Open-Meteo forecasts, regional seasonality, and historical agro-climatic patterns.',
    },
    {
      number: '03',
      title: 'Review crop recommendations and predictions.',
      desc: 'Receive verified crop rankings across 149 varieties, disease diagnosis, and expected yield metrics.',
    },
    {
      number: '04',
      title: 'Plan farming activities using the available tools.',
      desc: 'Execute with rotation schedules, live Agmarknet mandi market rates, and seasonal profit calculators.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F2] text-[#18251F] font-body selection:bg-[#087F5B] selection:text-white antialiased">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? 'bg-[#FAF8F2]/95 backdrop-blur-md border-b border-[#E8E4DA] shadow-sm py-3'
            : 'bg-[#FAF8F2]/85 backdrop-blur-sm border-b border-[#E8E4DA]/70 py-4'
          }`}
      >
        <nav className="mx-auto flex max-w-[1280px] items-center justify-between px-6 lg:px-8">
          {/* Brand Mark */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#073D2D] text-white shadow-sm group-hover:bg-[#087F5B] transition-colors">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                eco
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-lg font-headline font-extrabold tracking-tight text-[#073D2D] flex items-center gap-1">
                <span>AgriSense</span>
                <span className="text-[#087F5B]">AI</span>
              </div>
              <div className="text-[10px] font-label font-bold text-[#68756E] tracking-wider uppercase">
                <AzureTranslate text="Smart Agriculture" />
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#18251F]">
            <Link to="/recommend" className="hover:text-[#087F5B] transition-colors">
              <AzureTranslate text="Platform" />
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection('solutions')}
              className="hover:text-[#087F5B] transition-colors cursor-pointer"
            >
              <AzureTranslate text="Solutions" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#087F5B] transition-colors cursor-pointer"
            >
              <AzureTranslate text="How It Works" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('cta')}
              className="hover:text-[#087F5B] transition-colors cursor-pointer"
            >
              <AzureTranslate text="About" />
            </button>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-3.5">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Back to Eco Sense AI Button */}
            <a
              href="http://localhost:8000"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                  e.preventDefault();
                  window.location.href = "http://localhost:8000";
                }
              }}
              id="landing-back-to-ecosense-btn"
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#064E3B] hover:bg-[#047857] text-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-[#065F46]/50 hover:border-[#10B981]/50 group shrink-0"
              title="Back to Eco Sense AI"
            >
              <span className="text-sm leading-none font-bold transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span className="hidden sm:inline">Back to Eco Sense AI</span>
              <span className="sm:hidden">Eco Sense AI</span>
            </a>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex text-sm font-bold text-[#18251F] hover:text-[#087F5B] transition-colors px-2 py-1.5 cursor-pointer shrink-0"
            >
              <AzureTranslate text="Login" />
            </button>

            <button
              type="button"
              onClick={handleExplore}
              className="inline-flex items-center justify-center rounded-full bg-[#073D2D] hover:bg-[#087F5B] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
            >
              <AzureTranslate text="Get Started" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCD6C9] text-[#18251F] hover:bg-[#EFECE3] shrink-0"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E8E4DA] bg-[#FAF8F2] px-6 py-4 shadow-lg animate-fade-in space-y-3">
            <Link
              to="/recommend"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#18251F]"
            >
              <AzureTranslate text="Platform" />
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection('solutions')}
              className="block w-full text-left py-2 text-sm font-semibold text-[#18251F]"
            >
              <AzureTranslate text="Solutions" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 text-sm font-semibold text-[#18251F]"
            >
              <AzureTranslate text="How It Works" />
            </button>

            <div className="pt-3 border-t border-[#E8E4DA] flex items-center justify-between">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="text-sm font-bold text-[#18251F]"
              >
                <AzureTranslate text="Login" />
              </button>
            </div>

            <div className="pt-2">
              <a
                href="http://localhost:8000"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                    e.preventDefault();
                    window.location.href = "http://localhost:8000";
                  }
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#064E3B] hover:bg-[#047857] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                <span className="font-bold">←</span>
                <span>Back to Eco Sense AI</span>
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ── Section A: Cinematic Hero ───────────────────────────────────── */}
        <section className="relative overflow-hidden pt-20 min-h-[580px] lg:min-h-[640px] flex items-center bg-[#07251C]">
          {/* Layer 1: Vivid Agricultural Landscape Photography */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroImg}
              alt="Lush agricultural landscape with modern tractor at golden hour"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </div>

          {/* Layer 2: Balanced Subtle Gradient Overlay (Only behind text on left) */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#07241A]/95 via-[#07241A]/75 42% via-[#07241A]/20 70% to-transparent hidden md:block" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#07241A]/95 via-[#07241A]/75 to-[#07241A]/40 md:hidden" />

          {/* Layer 3: Left-Aligned Hero Content */}
          <div className="relative z-20 mx-auto max-w-[1280px] px-6 lg:px-8 py-16 lg:py-20 w-full">
            <div className="max-w-2xl">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#9DEBC1]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9DEBC1]" />
                <AzureTranslate text="INDIA-FIRST CROP INTELLIGENCE" />
              </div>

              {/* Bold Two-Line Headline (56-68px) */}
              <h1 className="mt-4 text-4xl sm:text-6xl lg:text-[64px] font-extrabold font-headline tracking-tight text-white leading-[1.08]">
                <AzureTranslate text="Smarter Farming." />
                <span className="block text-[#9DEBC1]">
                  <AzureTranslate text="Better Decisions." />
                </span>
              </h1>

              {/* Concise Description (17-19px) */}
              <p className="mt-5 text-base sm:text-lg lg:text-[18px] text-emerald-50/90 leading-relaxed font-normal max-w-xl">
                <AzureTranslate text="Make confident farming decisions with AI-powered crop recommendations, disease detection, weather intelligence, yield prediction, and market insights." />
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  type="button"
                  onClick={handleExplore}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#087F5B] hover:bg-[#076D4E] px-8 py-4 text-base font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <span><AzureTranslate text="Explore Platform" /></span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="inline-flex items-center justify-center rounded-full border border-white/40 bg-black/20 hover:bg-white/15 px-7 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all cursor-pointer"
                >
                  <AzureTranslate text="See How It Works" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section B: Solutions (Main Visual Highlight with 4 Preserved Images) ─ */}
        <section id="solutions" className="py-16 lg:py-20 bg-[#FAF8F2]">
          <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
            {/* Section Header */}
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold font-headline tracking-tight text-[#18251F]">
                <AzureTranslate text="Everything Your Farm Needs." />
              </h2>
              <p className="mt-3 text-base sm:text-lg text-[#68756E] leading-relaxed">
                <AzureTranslate text="One intelligent platform for crop planning, plant health, weather, and market decisions." />
              </p>
            </div>

            {/* 4 Preserved Solution Cards Arranged Horizontally */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {solutions.map((item, idx) => (
                <article
                  key={idx}
                  onClick={() => navigate(item.route)}
                  className="group relative flex flex-col justify-between rounded-2xl bg-white border border-[#E7E3D8] overflow-hidden shadow-sm hover:shadow-xl hover:border-[#087F5B]/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  {/* Preserved Original Image Asset */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#073D2D]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold font-headline text-[#18251F] group-hover:text-[#087F5B] transition-colors">
                        <AzureTranslate text={item.title} />
                      </h3>
                      <p className="mt-2.5 text-[15px] text-[#68756E] leading-relaxed">
                        <AzureTranslate text={item.desc} />
                      </p>
                    </div>

                    {/* Contextual Directional Action */}
                    <div className="mt-6 pt-4 border-t border-[#F0ECE2] flex items-center justify-between text-sm font-bold text-[#073D2D] group-hover:text-[#087F5B] transition-colors">
                      <span><AzureTranslate text={item.cta} /></span>
                      <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section C: How It Works (Concise 4-Step Horizontal Process) ──── */}
        <section id="how-it-works" className="py-16 lg:py-20 bg-white border-y border-[#ECE7DC]">
          <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#087F5B] font-label">
                <AzureTranslate text="SIMPLE 4-STEP PROCESS" />
              </div>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold font-headline tracking-tight text-[#18251F]">
                <AzureTranslate text="How It Works" />
              </h2>
              <p className="mt-2 text-base text-[#68756E] leading-relaxed">
                <AzureTranslate text="From initial field telemetry to actionable seasonal and market decisions." />
              </p>
            </div>

            {/* Horizontal 4-Step Layout on Desktop */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((st, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-[#FAF8F2] border border-[#E8E3D8] p-6 hover:border-[#087F5B]/30 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <span className="text-2xl font-headline font-black text-[#087F5B] block mb-3">
                      {st.number}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold font-headline text-[#18251F] leading-snug">
                      <AzureTranslate text={st.title} />
                    </h3>
                    <p className="mt-2.5 text-sm text-[#68756E] leading-relaxed">
                      <AzureTranslate text={st.desc} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section D: Closing CTA & Footer ──────────────────────────────── */}
        <section id="cta" className="relative overflow-hidden py-16 lg:py-20 bg-[#073D2D] text-white">
          {/* Subtle Farmland Background */}
          <div className="absolute inset-0 z-0">
            <img
              src={ctaImg}
              alt="Agricultural twilight landscape"
              className="w-full h-full object-cover object-center opacity-20"
              loading="lazy"
            />
          </div>

          {/* Dark Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#041A13] via-[#073D2D]/90 to-[#041A13]/80" />

          {/* CTA Content */}
          <div className="relative z-20 mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-headline tracking-tight leading-tight">
              <AzureTranslate text="Grow Smarter with AgriSense AI." />
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-emerald-100/90 leading-relaxed font-normal">
              <AzureTranslate text="Bring crop planning, plant health, weather, and market intelligence together in one place." />
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleExplore}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#087F5B] hover:bg-[#066C4C] px-8 py-4 text-base font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span><AzureTranslate text="Explore Crop Advisory" /></span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-white/30 hover:bg-white/10 px-7 py-4 text-base font-semibold text-white transition-all cursor-pointer"
              >
                <AzureTranslate text="Sign In" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Compact, Elegant Footer ────────────────────────────────────────── */}
      <footer className="bg-[#041A13] text-[#9BB3A7] border-t border-emerald-950 py-12">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#087F5B] text-white">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    eco
                  </span>
                </div>
                <div className="text-base font-headline font-extrabold text-white">
                  AgriSense <span className="text-[#9DEBC1]">AI</span>
                </div>
              </div>
              <p className="text-xs text-[#80998F] leading-relaxed">
                Smart Agriculture. Intelligent Decisions.
              </p>
              <p className="text-xs text-[#62776E]">
                Part of the <span className="text-emerald-200 font-medium">Eco Sense AI</span> platform.
              </p>
            </div>

            {/* Col 2: Platform Links */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                <AzureTranslate text="Platform" />
              </div>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link to="/recommend" className="hover:text-emerald-300 transition-colors">
                    <AzureTranslate text="Crop Advisory" />
                  </Link>
                </li>
                <li>
                  <Link to="/disease" className="hover:text-emerald-300 transition-colors">
                    <AzureTranslate text="Disease Detection" />
                  </Link>
                </li>
                <li>
                  <Link to="/weather" className="hover:text-emerald-300 transition-colors">
                    <AzureTranslate text="Weather Radar" />
                  </Link>
                </li>
                <li>
                  <Link to="/market" className="hover:text-emerald-300 transition-colors">
                    <AzureTranslate text="Market Prices" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Decision Tools */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                <AzureTranslate text="Decision Tools" />
              </div>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link to="/planner" className="hover:text-emerald-300 transition-colors">
                    <AzureTranslate text="Rotation Planner" />
                  </Link>
                </li>
                <li>
                  <Link to="/yield" className="hover:text-emerald-300 transition-colors">
                    <AzureTranslate text="Yield Prediction" />
                  </Link>
                </li>
                <li>
                  <Link to="/schemes" className="hover:text-emerald-300 transition-colors">
                    <AzureTranslate text="Government Schemes" />
                  </Link>
                </li>
                <li>
                  <Link to="/feedback" className="hover:text-emerald-300 transition-colors">
                    <AzureTranslate text="Feedback" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Project Info */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                <AzureTranslate text="Standards" />
              </div>
              <p className="text-xs text-[#80998F] leading-relaxed">
                Smart India Hackathon (SIH25010) Smart Crop Advisory System. 149 verified crops, keyless Open-Meteo feeds, and local MySQL architecture.
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-emerald-950/80 flex flex-col sm:flex-row items-center justify-between text-xs text-[#62776E] gap-4">
            <div>
              © 2026 AgriSense AI. Part of the Eco Sense AI Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => scrollToSection('solutions')}
                className="hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <AzureTranslate text="Solutions" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <AzureTranslate text="How It Works" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
