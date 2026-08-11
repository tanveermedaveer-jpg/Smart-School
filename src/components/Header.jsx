import React, { useState, useEffect } from 'react';
import { BookOpen, LogIn, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const [branding, setBranding] = useState({
    websiteName: "Smart School",
    tagline: "Management System",
    logo: ""
  });

  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem('websiteContent');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.branding) setBranding(parsed.branding);
    }
  }, []);

  return (
    <header className="bg-darkBlue text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="p-1 rounded-full flex items-center justify-center w-12 h-12 border border-white/20">
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <BookOpen className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl leading-tight">{branding.websiteName}</span>
            <span className="text-sm font-light text-gray-300 leading-tight">{branding.tagline}</span>
          </div>
        </div>

        {/* Navigation */}
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
        <div className="flex items-center gap-3">
          {/* Dark / Light Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="theme-toggle-btn"
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

          {/* Login Portal */}
          <a href="/login" className="bg-black hover:bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center space-x-2 border border-gray-800">
            <LogIn className="w-4 h-4" />
            <span>Login Portal</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
