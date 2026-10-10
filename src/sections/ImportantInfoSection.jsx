import React from 'react';
import { Info, Calendar, ShieldCheck, UserCheck, Music, Bell } from 'lucide-react';
import { EVENT_DETAILS } from '../data/eventData';
import infoCalendarImg from '../assets/info_calendar.png';
import infoRegistrationImg from '../assets/info_registration.png';
import infoCampusImg from '../assets/info_campus.png';
import infoMicImg from '../assets/info_mic.png';
import infoNoticeImg from '../assets/card_auditions.png';

const INFO_CARDS = [
  {
    id: 1,
    icon: Calendar,
    title: "EVENT DATES & SCHEDULE",
    body: "Auditions will be held on Thursday, 22 October 2026 at Aanganva, GSFC University. The Grand Showcase finale date will be officially revealed on 22 October during audition rounds. Detailed call sheets will be issued to registered candidates.",
    notice: "ORGANIZING COMMITTEE NOTICE",
    image: infoCalendarImg,
  },
  {
    id: 2,
    icon: ShieldCheck,
    title: "REGISTRATION GUIDELINES",
    body: "Registrations are completely free of charge. Open to all active GSFC University students with a valid enrollment number.",
    notice: "ORGANIZING COMMITTEE NOTICE",
    image: infoRegistrationImg,
  },
  {
    id: 3,
    icon: UserCheck,
    title: "ELIGIBILITY",
    body: "Enrolled undergraduate & postgraduate students from SOICT, SOCEFS, SOLS, SOCIS, and SOM&E.",
    notice: "ORGANIZING COMMITTEE NOTICE",
    image: infoCampusImg,
  },
  {
    id: 4,
    icon: Music,
    title: "PERFORMANCE & EQUIPMENT",
    body: "Stage lighting, sound setup, microphones, and basic PA systems are provided. Specific props or custom audio tracks must be pre-submitted.",
    notice: "ORGANIZING COMMITTEE NOTICE",
    image: infoMicImg,
  },
  {
    id: 5,
    icon: Bell,
    title: "OFFICIAL ANNOUNCEMENTS",
    body: "All official slot allocations, audition time slots, and finalist lists will be broadcast via the official WhatsApp group and college notice boards.",
    notice: "ORGANIZING COMMITTEE NOTICE",
    image: infoNoticeImg,
  }
];

export default function ImportantInfoSection() {
  return (
    <section id="info" className="pt-6 sm:pt-10 pb-10 sm:pb-14 px-6 sm:px-10 lg:px-12 relative">
      <div className="max-w-[1680px] mx-auto relative z-10">
        
        {/* Hero / Section Title Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 pb-8 border-b border-[#3A3029] gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-6 h-[1.5px] bg-[#E86F2D]" />
              <span className="font-mono text-xs tracking-widest text-[#E86F2D] uppercase font-semibold">
                OFFICIAL EVENT BRIEFING
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[#E86F2D] flex items-center justify-center text-[#E86F2D] shrink-0 bg-[#080B0C]">
                <Info className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="font-bebas text-5xl sm:text-7xl lg:text-8xl uppercase tracking-tight text-[#F1E8D8] leading-none">
                IMPORTANT <span className="text-[#E86F2D]">INFORMATION</span>
              </h2>
            </div>
          </div>

          {/* Upper Right Decorative Handwritten Phrase */}
          <div className="md:pb-2">
            <div className="font-hand text-2xl sm:text-3xl text-[#E86F2D] italic font-medium tracking-wide flex flex-col items-end">
              <span>Be Ready</span>
              <div className="flex items-center gap-1.5 -mt-1">
                <span className="w-4 h-[1px] bg-[#E86F2D]" />
                <span>Be You</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {INFO_CARDS.map((card) => {
            const IconComp = card.icon;

            return (
              <div
                key={card.id}
                className="group relative bg-[#111517] border border-[#3A3029] hover:border-[#E86F2D]/50 rounded-2xl overflow-hidden p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-md hover:-translate-y-1 min-h-[260px]"
              >
                {/* Background Image integrated into right 40-50% with dark gradient overlay */}
                <div className="absolute top-0 right-0 bottom-0 w-1/2 overflow-hidden pointer-events-none">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover object-center opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500 ease-out grayscale-[20%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#111517] via-[#111517]/90 to-transparent" />
                </div>

                {/* Card Top Content */}
                <div className="relative z-10 max-w-[85%] sm:max-w-[80%]">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-lg border border-[#E86F2D]/40 text-[#E86F2D] flex items-center justify-center bg-[#080B0C]/90 shadow-xs mb-4">
                    <IconComp className="w-5 h-5" />
                  </div>

                  {/* Title */}
                  <h3 className="font-bebas text-2xl sm:text-3xl uppercase tracking-wide text-[#F1E8D8] mb-3 leading-tight">
                    {card.title}
                  </h3>

                  {/* Body Text */}
                  <p className="text-sm sm:text-[15px] text-[#C9C5BD] leading-relaxed font-sans font-light">
                    {card.body}
                  </p>
                </div>

                {/* Card Bottom Organizing Committee Notice */}
                <div className="relative z-10 pt-4 mt-6 border-t border-[#3A3029] flex items-center gap-2">
                  <span className="w-4 h-[1.5px] bg-[#E86F2D]" />
                  <span className="font-mono text-[11px] text-[#E86F2D] tracking-widest uppercase font-semibold">
                    {card.notice}
                  </span>
                </div>


              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}


