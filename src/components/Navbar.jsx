import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Lock, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, canAccessPortal, openAuthModal, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'ABOUT', href: '#about' },
    { name: 'TALENTS', href: '#talents' },
    { name: 'FORMAT', href: '#how-it-works' },
    { name: 'RULES', href: '#rules' },
    { name: 'FAQ', href: '#faq' },
    { name: 'SPONSORS', href: '#sponsors' },
  ];

  const handleNavClick = (e, href) => {
    if (location.pathname !== '/') {
      navigate('/' + href);
      setMobileMenuOpen(false);
      return;
    }

    e.preventDefault();
    setMobileMenuOpen(false);
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRegisterClick = (e) => {
    if (!user) {
      e.preventDefault();
      openAuthModal('/register');
      setMobileMenuOpen(false);
    } else {
      navigate('/register');
      setMobileMenuOpen(false);
    }
  };

  const isHomePage = location.pathname === '/';
  const isTransparent = isHomePage && !scrolled;

  return (
    <header
      className="fixed top-0 left-0 right-0 w-full z-[9999] h-20 flex items-center"
      style={{
        transition: 'background 300ms ease, border-color 300ms ease, box-shadow 300ms ease, backdrop-filter 300ms ease, -webkit-backdrop-filter 300ms ease',
        background: isTransparent ? 'transparent' : 'rgba(7, 9, 10, 0.96)',
        backdropFilter: isTransparent ? 'none' : 'blur(10px)',
        WebkitBackdropFilter: isTransparent ? 'none' : 'blur(10px)',
        borderBottom: isTransparent ? 'none' : '1px solid rgba(230, 111, 46, 0.65)',
        boxShadow: isTransparent ? 'none' : '0 1px 10px rgba(230, 111, 46, 0.08)'
      }}
    >
      <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-12 flex items-center justify-between">
        
        {/* Left: GSFCU | GOT TALENT */}
        <Link to="/" className="group flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="font-bebas text-2xl sm:text-3xl tracking-wider text-[#F1E8D8] leading-none">
              GSFCU
            </span>
            <span className="text-[#3A3029] font-light text-xl">|</span>
            <span className="font-bebas text-2xl sm:text-3xl tracking-wider text-[#E86F2D] leading-none">
              GOT TALENT
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-widest text-[#C9C5BD]/70 uppercase mt-1">
            22 OCT 2026 • AUDITIONS • GSFC UNIVERSITY
          </span>
        </Link>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-9">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-xs font-mono tracking-widest text-[#C9C5BD] hover:text-[#E86F2D] uppercase transition-colors relative py-1 group"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#E86F2D] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Far Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* User Status / Login Trigger */}
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-[#FFBF00]/40 text-xs font-mono shadow-sm">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-5 h-5 rounded-full border border-[#FFBF00]/50 object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#FFBF00]/20 text-[#FFBF00] flex items-center justify-center text-[10px] font-bold">
                  {(user.displayName || user.name || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-[#F4E7D0] max-w-[90px] truncate text-[11px]">
                {user.displayName?.split(' ')[0] || user.name?.split(' ')[0] || 'Student'}
              </span>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="text-[#C9C5BD] hover:text-[#E86F2D] p-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('/register')}
              className="px-3.5 py-2 rounded-full border border-[#FFBF00]/40 hover:border-[#FFBF00] bg-black/40 text-xs font-mono font-bold tracking-wider text-[#FFBF00] hover:text-white transition-all cursor-pointer shadow-sm"
            >
              SIGN IN
            </button>
          )}

          {canAccessPortal && (
            <Link
              to="/portal"
              className="rounded bg-black/40 hover:bg-black/60 px-3.5 py-2 text-xs font-mono font-bold tracking-widest text-[#E86F2D] uppercase transition-all duration-200 flex items-center gap-1.5 border border-[#E86F2D]/50"
            >
              <Lock className="w-3 h-3" />
              <span>PORTAL</span>
            </Link>
          )}

          {/* REGISTER NOW Button */}
          <button
            type="button"
            onClick={handleRegisterClick}
            className="group relative overflow-hidden rounded bg-[#E86F2D] hover:bg-[#d05e1f] px-5 py-2.5 text-xs font-mono font-bold tracking-widest text-[#F1E8D8] uppercase transition-all duration-200 flex items-center gap-2 border border-[#E86F2D] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>REGISTER NOW</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden min-w-[44px] min-h-[44px] p-2 flex items-center justify-center rounded-md text-[#F1E8D8] hover:text-[#E86F2D] transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-[#E86F2D]" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-xs z-[9998]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed top-[80px] left-0 right-0 bg-[#080B0C] border-b border-[#3A3029] p-6 flex flex-col gap-6 shadow-2xl z-[9999] animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-xs font-mono tracking-widest text-[#C9C5BD] hover:text-[#E86F2D] uppercase transition-colors py-3 border-b border-[#3A3029]/50 flex items-center justify-between min-h-[44px]"
                >
                  <span>{link.name}</span>
                  <span className="text-[#E86F2D]">→</span>
                </a>
              ))}
            </nav>

            {/* Mobile Auth info / Action */}
            {user ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FFBF00]" />
                  <span className="text-[#F4E7D0]">{user.displayName || user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-[#E86F2D] hover:underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('/register');
                }}
                className="w-full text-center py-3 rounded border border-[#FFBF00]/40 text-[#FFBF00] font-mono text-xs uppercase tracking-widest cursor-pointer"
              >
                Sign In with Google
              </button>
            )}

            <button
              type="button"
              onClick={handleRegisterClick}
              className="w-full text-center bg-[#E86F2D] hover:bg-[#d05e1f] text-[#F1E8D8] py-3.5 rounded font-mono font-bold text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2 min-h-[44px] border border-[#E86F2D] cursor-pointer"
            >
              REGISTER NOW <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </header>
  );
}
