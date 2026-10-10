import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import stageCtaBg from '../assets/stage_cta_bg.png';

export default function RegistrationCtaSection() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  return (
    <section className="w-full min-h-[640px] lg:h-[700px] relative overflow-hidden flex flex-col justify-center items-center text-center select-none bg-[#050507] border-t border-[#C49A3A]/15 z-10 font-sans">
      
      {/* 1. Realistic Live Stage Photograph Background (High Visibility) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transform scale-[1.01]"
        style={{ backgroundImage: `url(${stageCtaBg})` }}
      />

      {/* 2. Light Ambient Darkening (Keeps auditorium, crowd, mic stand & stage lights clear) */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* 3. Soft Natural Dark Gradient Behind Central Text Only */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(5,5,7,0.80)_0%,_rgba(5,5,7,0.40)_55%,_rgba(5,5,7,0)_80%)] pointer-events-none" />

      {/* 4. Smooth Bottom & Top Gradient Fades to Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-b from-transparent via-[#050507]/60 to-[#050507] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-t from-transparent via-[#050507]/50 to-[#050507] pointer-events-none" />

      {/* Subtle Film Grain Overlay */}
      <div className="absolute inset-0 bg-grain pointer-events-none opacity-15" />

      {/* 5. Center Section Content */}
      <div data-reveal className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center my-auto py-12 sm:py-16">
        
        {/* Top Eyebrow / Label */}
        <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
          <span className="w-6 sm:w-12 h-[1px] bg-[#E86F2D]/60 inline-block" />
          <div className="flex items-center gap-2">
            <span className="text-[#E86F2D] text-xs">✦</span>
            <span className="font-mono text-[11px] xs:text-xs sm:text-sm tracking-[0.25em] sm:tracking-[0.3em] text-[#F4E7D0] uppercase font-medium">
              FINAL CALL FOR <span className="text-[#E86F2D] font-bold">ENTRIES</span>
            </span>
            <span className="text-[#E86F2D] text-xs">✦</span>
          </div>
          <span className="w-6 sm:w-12 h-[1px] bg-[#E86F2D]/60 inline-block" />
        </div>

        {/* Main Heading */}
        <h2 className="font-bebas text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-[98px] xl:text-[104px] uppercase tracking-wider leading-[0.92] mb-2 sm:mb-3">
          <span className="text-[#F5EBD9]">THE STAGE IS </span>
          <span className="text-[#E86F2D]">YOURS.</span>
        </h2>

        {/* Tagline with Brush Underline */}
        <div className="relative mb-7 sm:mb-9 flex flex-col items-center">
          <p className="font-hand text-2xl xs:text-3xl sm:text-4xl lg:text-[42px] text-[#E86F2D] font-normal italic tracking-wide">
            "Expect The Unexpected"
          </p>
          {/* Hand-drawn underline SVG */}
          <svg className="w-44 xs:w-56 sm:w-64 h-3.5 text-[#E86F2D] -mt-1 sm:-mt-1.5" viewBox="0 0 250 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10.5C45 4.5 110 2.5 247 6.5C180 11.5 80 13 15 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Primary CTA Button */}
        <div className="relative group mb-10 sm:mb-14">
          <button
            type="button"
            onClick={() => (!user ? openAuthModal('/register') : navigate('/register'))}
            className="relative inline-flex items-center justify-center gap-3 px-8 xs:px-10 sm:px-12 py-4 sm:py-4.5 rounded-[8px] bg-[#E86F2D] hover:bg-[#D45F20] active:bg-[#B84E15] text-[#F5EBD9] font-mono font-bold text-xs sm:text-sm tracking-[0.2em] uppercase shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-[#F4E7D0]/20 btn-hover-subtle cursor-pointer"
          >
            <span>TAKE THE STAGE</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform duration-200 text-[#F5EBD9]" />
          </button>
        </div>

        {/* Event Information Strip (Clean, Refined, Compact) */}
        <div className="w-full max-w-3xl mx-auto px-2">
          <div className="pt-5 border-t border-[#E86F2D]/20 flex flex-wrap items-center justify-center gap-y-3 gap-x-5 sm:gap-x-7 text-xs sm:text-sm font-mono">
            
            {/* Auditions Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E86F2D] shrink-0" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] sm:text-xs text-[#E86F2D] tracking-widest uppercase font-semibold">
                  AUDITIONS:
                </span>
                <span className="font-bold text-[#F4E7D0] tracking-wider uppercase">
                  22 OCTOBER 2026 • THURSDAY
                </span>
              </div>
            </div>

            {/* Divider */}
            <span className="hidden lg:inline text-[#E86F2D]/40 font-sans">|</span>

            {/* Venue */}
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E86F2D] shrink-0" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] sm:text-xs text-[#E86F2D] tracking-widest uppercase font-semibold">
                  VENUE:
                </span>
                <span className="font-bold text-[#F4E7D0] tracking-wider uppercase">
                  AANGANVA, GSFC UNIVERSITY
                </span>
              </div>
            </div>

          </div>
        </div>


      </div>
    </section>
  );
}
