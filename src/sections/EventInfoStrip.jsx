import React from 'react';
import { EVENT_DETAILS } from '../data/eventData';
import { Calendar, MapPin, Radio, Sparkles } from 'lucide-react';

export default function EventInfoStrip() {
  const items = [
    { icon: Calendar, text: `AUDITIONS: ${EVENT_DETAILS.auditionDate}`, highlight: true },
    { icon: MapPin, text: "AANGANVA, GSFC UNIVERSITY" },
    { icon: Radio, text: "AUDITIONS: 22 OCT 2026" },
    { icon: Sparkles, text: "2026 EDITION", highlight: true },
  ];

  return (
    <div id="event-strip" className="w-full bg-[#0a0a0d] py-4 sm:py-5 relative z-20 overflow-hidden select-none border-t border-[#C49A3A]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:flex lg:flex-wrap items-center justify-between gap-3 sm:gap-4 md:gap-8">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={idx}>
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${item.highlight ? 'text-[#C96B35]' : 'text-[#C49A3A]'}`} />
                  <span className={`text-[10px] xs:text-xs sm:text-sm font-mono tracking-wider sm:tracking-widest uppercase ${item.highlight ? 'text-[#F4E7D0] font-bold' : 'text-[#F4E7D0]/80'}`}>
                    {item.text}
                  </span>
                </div>
                {idx < items.length - 1 && (
                  <div className="hidden lg:block text-[#C96B35]/40 text-xs">◆</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
