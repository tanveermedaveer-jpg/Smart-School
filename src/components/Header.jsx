import React, { useState, useEffect } from 'react';
import { BookOpen, LogIn, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

const Header = () => {
  const [branding, setBranding] = useState({
    websiteName: "Smart School",
    tagline: "Management System",
    logo: ""
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem('websiteContent');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.branding) setBranding(parsed.branding);
    }
  }, []);

  const navLinks = [
    { href: "#home", label: "Home" },
    { href: "#about", label: "About" },
    { href: "#features", label: "Features" },
    { href: "#gallery", label: "Gallery" },
    { href: "#admission", label: "Online Admission" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <header className="bg-darkBlue text-white sticky top-0 z-50 shadow-lg w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-6 py-3 flex justify-between items-center max-w-full gap-1.5 sm:gap-3">
        
        {/* Logo and Title */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 cursor-pointer shrink-0 min-w-0">
          <div className="p-1 rounded-full flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 border border-white/20 shrink-0">
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs sm:text-lg leading-tight truncate">{branding.websiteName}</span>
            <span className="text-[9px] sm:text-xs font-light text-gray-300 leading-tight hidden sm:block truncate">{branding.tagline}</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-8 text-sm font-medium">
          <a href="#home" className="text-white relative group pb-1">
            Home
            <span className="absolute -bottom-1 left-0 w-full h-1 bg-greenAccent transition-all rounded-full"></span>
          </a>
          <a href="#about" className="text-gray-300 hover:text-white transition-colors relative group pb-1">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-greenAccent transition-all group-hover:w-full"></span>
          </a>
          <a href="#features" className="text-gray-300 hover:text-white transition-colors relative group">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-greenAccent transition-all group-hover:w-full"></span>
          </a>
          <a href="#gallery" className="text-gray-300 hover:text-white transition-colors relative group">
            Gallery
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-greenAccent transition-all group-hover:w-full"></span>
          </a>
          <a href="#admission" className="text-gray-300 hover:text-white transition-colors relative group">
            Online Admission
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-greenAccent transition-all group-hover:w-full"></span>
          </a>
          <a href="#contact" className="text-gray-300 hover:text-white transition-colors relative group">
            Contact
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-greenAccent transition-all group-hover:w-full"></span>
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Dark / Light Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="theme-toggle-btn p-1.5 sm:p-2"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Login Portal Button */}
          <Link 
            to="/login" 
            className="bg-black hover:bg-gray-900 text-white px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center space-x-1 border border-gray-800 text-[11px] sm:text-sm whitespace-nowrap shrink-0"
          >
            <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Login Portal</span>
            <span className="xs:hidden">Login</span>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg text-white hover:bg-white/20 transition-all focus:outline-none shrink-0 border border-white/30 bg-white/10 flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-darkBlue/98 backdrop-blur-md border-t border-white/10 px-6 py-4 space-y-3 transition-all duration-200 shadow-2xl">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-gray-200 hover:text-greenAccent font-medium text-base py-2 transition-colors border-b border-white/5 last:border-0"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
