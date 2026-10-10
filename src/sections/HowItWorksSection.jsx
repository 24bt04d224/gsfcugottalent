import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Mic, Sparkles, ArrowRight } from 'lucide-react';
import { EVENT_DETAILS } from '../data/eventData';
import registerImg from '../assets/card_register.png';
import auditionsImg from '../assets/card_auditions.png';
import showcaseImg from '../assets/card_showcase.png';

const CARDS_DATA = [
  {
    stepNumber: "01",
    phaseLabel: "STAGE PHASE 01",
    title: "REGISTER",
    subtitle: "LOCK IN YOUR SLOT",
    description: "Complete your online registration on this portal before the deadline. Choose your category, specify solo or group performance, and submit student details.",
    ctaText: "TAKE THE STAGE",
    ctaLink: "/register",
    image: registerImg,
    icon: ClipboardCheck,
  },
  {
    stepNumber: "02",
    phaseLabel: "STAGE PHASE 02",
    title: "AUDITIONS",
    subtitle: "22 OCTOBER 2026 • THURSDAY",
    description: "Perform your preliminary act in front of our faculty & guest judges panel during the campus audition rounds at Aanganva, GSFC University on Thursday, 22 October 2026. Receive immediate jury feedback.",
    ctaText: "BRING YOUR BEST",
    ctaLink: null,
    image: auditionsImg,
    icon: Mic,
  },
  {
    stepNumber: "03",
    phaseLabel: "STAGE PHASE 03",
    title: "GRAND SHOWCASE",
    subtitle: "DATE REVEALING AT AUDITIONS",
    description: "Shortlisted finalists will take center stage before a live audience and celebrity judges at Aanganva, GSFC University. Grand Showcase finale date will be officially revealed on Thursday, 22 October 2026 during auditions.",
    ctaText: "THE FINAL STAGE",
    ctaLink: null,
    image: showcaseImg,
    icon: Sparkles,
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="pt-16 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div data-reveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 pb-6 border-b border-[#C49A3A]/15 gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="w-6 h-[1.5px] bg-[#C96B35]" />
              <span className="font-mono text-xs tracking-widest text-[#C49A3A] uppercase font-semibold">
                EVENT FORMAT & ROADMAP
              </span>
            </div>
            <h2 className="font-bebas text-4xl xs:text-5xl sm:text-6xl lg:text-7xl uppercase tracking-tight text-[#F4E7D0] leading-none">
              HOW IT <span className="text-[#C96B35]">WORKS</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#B5ACA0] font-sans font-light tracking-wide mt-3">
              Three stages. One platform. Your moment to shine.
            </p>
          </div>

          {/* Right side handwritten accent */}
          <div className="md:pb-1">
            <span className="font-hand text-xl sm:text-2xl text-[#C96B35]/90 italic font-medium tracking-wide block">
              Show Your Talent
            </span>
          </div>
        </div>

        {/* 3 Main Editorial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {CARDS_DATA.map((card, index) => {
            const IconComponent = card.icon;

            return (
              <div
                key={card.stepNumber}
                data-reveal
                data-reveal-delay={String(index + 1)}
                className="group relative hover-lift bg-[#0b0b0e] border border-[#C49A3A]/20 hover:border-[#C96B35]/50 rounded-[18px] overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md"
              >

                {/* Subtle Photography Container with Dark Overlay */}
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-[#101014]">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover object-center opacity-45 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500 ease-out grayscale-[20%] group-hover:grayscale-0"
                  />
                  {/* Dark Vignette and Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0e] via-[#0b0b0e]/70 to-black/50" />

                  {/* Upper Header Row: Icon & Large Faded Stage Number */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <div className="w-9 h-9 rounded-lg bg-[#08080a]/85 backdrop-blur-xs border border-[#C49A3A]/30 flex items-center justify-center text-[#C96B35] shadow-xs">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="font-bebas text-5xl sm:text-6xl text-[#F4E7D0]/15 group-hover:text-[#C49A3A]/30 transition-colors select-none leading-none">
                      {card.stepNumber}
                    </span>
                  </div>
                </div>

                {/* Card Main Body Content */}
                <div className="p-6 sm:p-7 flex-grow flex flex-col justify-between -mt-4 relative z-10">
                  <div>
                    <h3 className="font-bebas text-2xl xs:text-3xl sm:text-3xl uppercase tracking-wide text-[#F4E7D0] mb-1 leading-none">
                      {card.title}
                    </h3>
                    <p className="font-mono text-[11px] sm:text-xs text-[#C49A3A] uppercase tracking-wider mb-4 font-medium">
                      {card.subtitle}
                    </p>

                    <p className="text-xs sm:text-sm text-[#B5ACA0] leading-relaxed font-sans font-normal">
                      {card.description}
                    </p>
                  </div>

                  {/* Thin Divider & Card Micro-CTA Footer */}
                  <div className="pt-4 mt-6 border-t border-[#C49A3A]/15 flex items-center justify-between text-xs font-mono">
                    <span className="text-[10.5px] sm:text-[11px] text-[#B5ACA0] tracking-widest uppercase">
                      {card.phaseLabel}
                    </span>

                    {card.ctaLink ? (
                      <Link
                        to={card.ctaLink}
                        className="text-[#C96B35] hover:text-[#F4E7D0] font-semibold text-xs tracking-wider flex items-center gap-1.5 transition-colors group/btn py-1"
                      >
                        <span>{card.ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <div className="text-[#C96B35] font-semibold text-xs tracking-wider flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity py-1">
                        <span>{card.ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}


