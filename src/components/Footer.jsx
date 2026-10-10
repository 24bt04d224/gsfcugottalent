import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, MapPin, Mail, AtSign, ArrowUp, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EVENT_DETAILS } from '../data/eventData';

export default function Footer() {
  const { canAccessPortal, loading } = useAuth();


  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#050507] border-t border-[#3A3029] text-[#F4E7D0] pt-14 sm:pt-18 pb-8 sm:pb-12 relative overflow-hidden font-sans">
      {/* Subtle top ambient divider line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#E86F2D]/60 to-transparent opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 pb-10 sm:pb-12 border-b border-[#3A3029]/60">
          
          {/* LEFT COLUMN — BRAND */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E86F2D]/15 border border-[#E86F2D]/40 flex items-center justify-center shrink-0 text-[#E86F2D]">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bebas text-2xl sm:text-3xl tracking-wider text-[#F1E8D8] leading-none">
                GSFCU <span className="text-[#E86F2D]">GOT TALENT</span>
              </span>
            </div>

            <p className="font-bebas text-xl sm:text-2xl tracking-wide text-[#E86F2D] uppercase">
              "EXPECT THE UNEXPECTED"
            </p>

            <p className="text-xs text-[#C9C5BD] leading-relaxed max-w-sm font-sans font-light">
              The flagship annual talent showcase of GSFC University. Celebrating raw student passion, artistic mastery, and cinematic stage performances.
            </p>

            <div className="pt-1">
              <span className="inline-block px-3 py-1 rounded-full bg-[#E86F2D]/10 border border-[#E86F2D]/30 text-[10px] font-mono text-[#E86F2D] tracking-widest uppercase font-semibold">
                2026 EDITION

              </span>
            </div>
          </div>

          {/* CENTER COLUMN — EVENT DETAILS */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <h4 className="text-xs font-mono tracking-widest text-[#E86F2D] uppercase font-bold">
              EVENT DETAILS
            </h4>
            
            <ul className="space-y-3 text-xs text-[#C9C5BD] font-sans">
              <li className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[#E86F2D] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#F1E8D8] font-medium block">Auditions: Thursday, 22 October 2026</span>
                  <span className="text-[#A69E90] text-[11px] block mt-0.5">Grand Showcase: Revealing 22 Oct</span>
                </div>
              </li>
              
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#E86F2D] shrink-0" />
                <span className="text-[#F1E8D8] font-medium">Aanganva, GSFC University</span>
              </li>

              <li className="flex items-center gap-3">
                <AtSign className="w-4 h-4 text-[#E86F2D] shrink-0" />
                <a
                  href="https://instagram.com/radiogsfcu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#E86F2D] transition-colors font-mono"
                >
                  @radiogsfcu
                </a>
              </li>

              <li className="flex items-center gap-3">
                <AtSign className="w-4 h-4 text-[#E86F2D] shrink-0" />
                <a
                  href="https://instagram.com/theatreclub_gsfcu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#E86F2D] transition-colors font-mono"
                >
                  @theatreclub_gsfcu
                </a>
              </li>

              <li className="flex items-center gap-3 pt-0.5">
                <Mail className="w-4 h-4 text-[#E86F2D] shrink-0" />
                <a
                  href="mailto:radiogsfcu@gsfcuniversity.ac.in"
                  className="hover:text-[#E86F2D] transition-colors font-mono break-all"
                >
                  radiogsfcu@gsfcuniversity.ac.in
                </a>

              </li>
            </ul>
          </div>

          {/* RIGHT COLUMN — NAVIGATION */}
          <div className="md:col-span-3 flex flex-col justify-between gap-6">
            <div>
              <h4 className="text-xs font-mono tracking-widest text-[#E86F2D] uppercase font-bold mb-4">
                NAVIGATION
              </h4>
              <div className="flex flex-col gap-2.5 text-xs text-[#C9C5BD] font-mono">
                <a href="#about" className="hover:text-[#E86F2D] transition-colors">About</a>
                <a href="#talents" className="hover:text-[#E86F2D] transition-colors">Categories</a>
                <a href="#how-it-works" className="hover:text-[#E86F2D] transition-colors">How It Works</a>
                <a href="#rules" className="hover:text-[#E86F2D] transition-colors">Rules</a>
                <a href="#faq" className="hover:text-[#E86F2D] transition-colors">FAQ</a>
                <Link to="/register" className="text-[#E86F2D] font-bold hover:underline">Register Now</Link>
              </div>
            </div>

            <div>
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C9C5BD] hover:text-[#F1E8D8] transition-colors py-1 cursor-pointer"
              >
                <span>Back to Top</span>
                <ArrowUp className="w-3.5 h-3.5 text-[#E86F2D]" />

              </button>
            </div>
          </div>

        </div>

        {/* BOTTOM FOOTER */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-[#C9C5BD]">
          <p>© 2026 GSFC University. All Rights Reserved.</p>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[#C9C5BD]/80">GSFCU GOT TALENT 2026</span>
            <span className="text-[#3A3029]">•</span>
            {!loading && canAccessPortal ? (
              <Link
                to="/portal"
                className="font-mono text-[#E86F2D] hover:underline flex items-center gap-1"
              >
                <span>ORGANIZER DASHBOARD 🔒</span>
              </Link>
            ) : (
              <Link
                to="/portal"
                className="font-mono text-[#C9C5BD]/60 hover:text-[#E86F2D] transition-colors flex items-center gap-1"
                title="Committee & Stage Control Login"
              >
                <Lock className="w-3 h-3" />
                <span>COMMITTEE LOGIN</span>
              </Link>
            )}
          </div>
        </div>


      </div>
    </footer>
  );
}
