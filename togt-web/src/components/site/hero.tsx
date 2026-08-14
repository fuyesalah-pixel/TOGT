'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, ArrowRight, Phone } from 'lucide-react';
import { useSmartForm } from '@/components/smart-form/smart-form-context';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Slide data ──────────────────────────────────────────────────────────── */
const slides = [
  { id: 'domestic', image: '/images/hero/hero-benuna-image-domesetic-1st.jpg', eyebrow: 'EXPLORE_ETHIOPIA',    title: 'HERO_DOMESTIC_TITLE', subtitle: 'HERO_DOMESTIC_SUBTITLE', ctaLabel: 'HERO_DOMESTIC_CTA', ctaAction: 'domestic' as const },
  { id: 'umrah',    image: '/images/hero/hero-umra-2nd.jpg',                   eyebrow: 'HERO_UMRAH_EYEBROW',  title: 'HERO_UMRAH_TITLE',    subtitle: 'HERO_UMRAH_SUBTITLE',    ctaLabel: 'HERO_UMRAH_CTA',    ctaAction: 'umrah'    as const },
  { id: 'ticket',   image: '/images/hero/hero-tecketing-3rd.jpg',              eyebrow: 'HERO_TICKET_EYEBROW', title: 'HERO_TICKET_TITLE',   subtitle: 'HERO_TICKET_SUBTITLE',   ctaLabel: 'HERO_TICKET_CTA',   ctaAction: 'ticket'   as const },
  { id: 'iata',     image: '/images/hero/hero-IATA-partner-4th.jfif',          eyebrow: 'HERO_IATA_EYEBROW',   title: 'HERO_IATA_TITLE',     subtitle: 'HERO_IATA_SUBTITLE',     ctaLabel: 'HERO_IATA_CTA',     ctaAction: 'why-togt' as const },
  { id: 'visa',     image: '/images/hero/hero-visa-proccess-5th.jpg',          eyebrow: 'HERO_VISA_EYEBROW',   title: 'HERO_VISA_TITLE',     subtitle: 'HERO_VISA_SUBTITLE',     ctaLabel: 'HERO_VISA_CTA',     ctaAction: 'visa'     as const },
];

type CTAAction = 'domestic' | 'umrah' | 'ticket' | 'visa';

/* ─── Zoom-out + fade slide variant ──────────────────────────────────────── */
const slideVariants = {
  enter: {
    opacity: 0,
    scale: 1.15,
  },
  center: {
    opacity: 1,
    scale: 1,
    transition: {
      opacity: { duration: 0.8,  ease: 'easeOut'   as const },
      scale:   { duration: 1.6,  ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      opacity: { duration: 0.5, ease: 'easeIn' as const },
      scale:   { duration: 0.5, ease: 'easeIn' as const },
    },
  },
};

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ─── Stable orange particle seeds (avoids hydration mismatch) ───────────── */
const PARTICLES = [
  { size: 6, left: '8%',  delay: 0,   dur: 8  },
  { size: 4, left: '18%', delay: 2,   dur: 10 },
  { size: 7, left: '27%', delay: 1,   dur: 7  },
  { size: 3, left: '36%', delay: 3,   dur: 9  },
  { size: 5, left: '45%', delay: 0.5, dur: 11 },
  { size: 6, left: '54%', delay: 1.5, dur: 8  },
  { size: 4, left: '63%', delay: 2.5, dur: 10 },
  { size: 7, left: '72%', delay: 0.8, dur: 7  },
  { size: 3, left: '81%', delay: 1.8, dur: 9  },
  { size: 5, left: '90%', delay: 3.5, dur: 12 },
  { size: 4, left: '13%', delay: 2.2, dur: 8  },
  { size: 6, left: '40%', delay: 4,   dur: 10 },
  { size: 3, left: '58%', delay: 0.3, dur: 9  },
  { size: 5, left: '76%', delay: 2.8, dur: 11 },
  { size: 4, left: '94%', delay: 1.2, dur: 8  },
];

/* ─── Floating orange particles ──────────────────────────────────────────── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[#FF9300]"
          style={{
            width:  p.size,
            height: p.size,
            left:   p.left,
            bottom: '-10px',
            boxShadow: `0 0 ${p.size * 2}px rgba(255,147,0,0.55)`,
          }}
          animate={{
            y:       ['0%', '-110vh'],
            opacity: [0, 0.65, 0.65, 0],
          }}
          transition={{
            duration: p.dur,
            delay:    p.delay,
            repeat:   Infinity,
            ease:     'linear',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
export function Hero() {
  const t = useTranslations('Hero');
  const { openTab } = useSmartForm();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHolding,    setIsHolding]    = useState(false);
  const touchStartX = useRef(0);
  const touchEndX   = useRef(0);

  /* Auto-advance every 3s — pauses only on hold, not on hover */
  useEffect(() => {
    if (isHolding) return;
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % slides.length), 3000);
    return () => clearInterval(timer);
  }, [isHolding]);

  const goToSlide = useCallback((i: number) => setCurrentSlide(i), []);
  const nextSlide = useCallback(() => setCurrentSlide(p => (p + 1) % slides.length), []);
  const prevSlide = useCallback(() => setCurrentSlide(p => (p - 1 + slides.length) % slides.length), []);

  /* Keyboard nav */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nextSlide, prevSlide]);

  const handleCTA = (action: string) => {
    const valid: CTAAction[] = ['domestic', 'umrah', 'ticket', 'visa'];
    if (valid.includes(action as CTAAction)) openTab(action as CTAAction);
  };

  const slide = slides[currentSlide];

  return (
    <section
      id="hero"
      className="hero-section relative w-full overflow-hidden bg-[#12394F]"
      /* Hold to pause */
      onMouseDown={() => setIsHolding(true)}
      onMouseUp={() => setIsHolding(false)}
      onMouseLeave={() => setIsHolding(false)}
      onTouchStart={e => {
        touchStartX.current = e.touches[0].clientX;
        setIsHolding(true);
      }}
      onTouchEnd={e => {
        touchEndX.current = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
          if (diff > 0) nextSlide(); else prevSlide();
        }
        setIsHolding(false);
      }}
    >
      {/* ── LAYER 1: Zoom-out + fade background image ────────────────────── */}
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={currentSlide}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={t(slide.title)}
            fill
            priority={currentSlide === 0}
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* ── LAYER 2: Overlays ────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-black/75 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1F67B1]/35 via-transparent to-[#FF9300]/20 z-[1]" />
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/60 to-transparent z-[1]" />

      {/* ── LAYER 3: Floating orange particles ───────────────────────────── */}
      <FloatingParticles />

      {/* ── LAYER 4: Main content — centered ─────────────────────────────── */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-6 md:px-8 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="flex flex-col items-center gap-5 md:gap-6"
            >
              {/* Eyebrow badge */}
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12, duration: 0.4, ease: EASE }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs md:text-sm font-semibold tracking-wider"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,147,0,0.35)',
                  color: '#FF9300',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF9300] animate-pulse" />
                {t(slide.eyebrow)}
              </motion.span>

              {/* Headline — Playfair Display */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.6, ease: EASE }}
                className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white"
              >
                {t(slide.title)}
                <span
                  className="block bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #FF9300 0%, #FFD700 50%, #FF9300 100%)' }}
                >
                  {slide.id.charAt(0).toUpperCase() + slide.id.slice(1)}
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.55, ease: EASE }}
                className="text-white/75 text-sm md:text-base lg:text-lg max-w-xl mx-auto leading-relaxed"
              >
                {t(slide.subtitle)}
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.56, duration: 0.55, ease: EASE }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full"
              >
                <motion.button
                  onClick={() => handleCTA(slide.ctaAction)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-2.5 px-7 md:px-9 py-3.5 md:py-4 rounded-full font-bold text-white text-sm md:text-base"
                  style={{
                    background: 'linear-gradient(135deg, #FF9300 0%, #e07d00 100%)',
                    boxShadow: '0 4px 24px rgba(255,147,0,0.45)',
                  }}
                >
                  <span>{t(slide.ctaLabel)}</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.span>
                </motion.button>

                <motion.a
                  href="tel:+251911234567"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2.5 px-7 md:px-9 py-3.5 md:py-4 rounded-full font-semibold text-white text-sm md:text-base transition-all duration-300"
                  style={{
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.6)';
                    (e.currentTarget as HTMLElement).style.background  = 'rgba(255,255,255,0.12)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)';
                    (e.currentTarget as HTMLElement).style.background  = 'rgba(255,255,255,0.06)';
                  }}
                >
                  <Phone className="w-4 h-4 md:w-5 md:h-5 text-[#FF9300]" />
                  <span>24/7 Call Center</span>
                </motion.a>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── LAYER 5: Prev / Next arrows ──────────────────────────────────── */}
      <motion.button
        onClick={prevSlide}
        aria-label="Previous slide"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full text-white transition-all duration-300"
        style={{ background: 'rgba(18,57,79,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,147,0,0.28)'; e.currentTarget.style.borderColor = 'rgba(255,147,0,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(18,57,79,0.5)';   e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      <motion.button
        onClick={nextSlide}
        aria-label="Next slide"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full text-white transition-all duration-300"
        style={{ background: 'rgba(18,57,79,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,147,0,0.28)'; e.currentTarget.style.borderColor = 'rgba(255,147,0,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(18,57,79,0.5)';   e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>

      {/* ── LAYER 6: Bottom — dots + scroll hint ─────────────────────────── */}
      <div className="absolute bottom-3 md:bottom-5 inset-x-0 z-20 flex flex-col items-center gap-3">

        {/* Dot indicators only (no counter, no progress bar) */}
        <div className="flex items-center gap-2">
          {slides.map((s, i) => (
            <motion.button
              key={s.id}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              layout
              animate={{
                width:           i === currentSlide ? 28 : 7,
                opacity:         i === currentSlide ? 1 : 0.4,
                backgroundColor: i === currentSlide ? '#FF9300' : 'rgba(255,255,255,0.8)',
                boxShadow:       i === currentSlide ? '0 0 8px 2px rgba(255,147,0,0.65)' : 'none',
              }}
              transition={{ duration: 0.35, ease: EASE }}
              className="h-[7px] rounded-full cursor-pointer"
              whileHover={{ opacity: 0.8 }}
            />
          ))}
        </div>

        {/* Scroll to explore */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-white/35 text-[9px] tracking-[0.35em] font-semibold uppercase">
            Scroll to Explore
          </span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.7, ease: 'easeInOut' }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#FF9300]/55 rotate-90" />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
