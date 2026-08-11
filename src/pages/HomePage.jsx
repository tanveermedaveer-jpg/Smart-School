import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Features from '../components/Features';
import Gallery from '../components/Gallery';
import Admission from '../components/Admission';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext';

const HomePage = () => {
  const { isDark } = useTheme();
  const [content, setContent] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('websiteContent');
    if (saved) {
      const parsed = JSON.parse(saved);
      setContent(parsed);
      
      // Update SEO
      if (parsed.seo) {
        document.title = parsed.seo.title || 'Smart School Management System';
        
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.name = "description";
          document.head.appendChild(metaDescription);
        }
        metaDescription.content = parsed.seo.description;

        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.name = "keywords";
          document.head.appendChild(metaKeywords);
        }
        metaKeywords.content = parsed.seo.keywords;
      }
      
      // Update Favicon
      if (parsed.branding && parsed.branding.favicon) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = parsed.branding.favicon;
      }
    }
  }, []);

  useEffect(() => {
    // We wait 350ms for child subcomponents to fully mount and render
    const timer = setTimeout(() => {
      const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      };

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            obs.unobserve(entry.target);
          }
        });
      }, observerOptions);

      // 1. About section elements
      const aboutSec = document.querySelector('#about');
      if (aboutSec) {
        const title = aboutSec.querySelector('h2');
        const underline = aboutSec.querySelector('.w-16');
        const subtitle = aboutSec.querySelector('p.max-w-2xl');
        if (title) { title.classList.add('reveal-on-scroll'); observer.observe(title); }
        if (underline) { underline.classList.add('reveal-on-scroll', 'stagger-delay-100'); observer.observe(underline); }
        if (subtitle) { subtitle.classList.add('reveal-on-scroll', 'stagger-delay-200'); observer.observe(subtitle); }

        const cards = aboutSec.querySelectorAll('.grid:first-of-type > div');
        cards.forEach((card, idx) => {
          card.classList.add('reveal-on-scroll');
          card.classList.add(`stagger-delay-${(idx % 3) * 100}`);
          observer.observe(card);
        });

        const imgDiv = aboutSec.querySelector('img')?.parentElement;
        if (imgDiv) {
          imgDiv.classList.add('reveal-scale');
          observer.observe(imgDiv);
        }

        const stats = aboutSec.querySelectorAll('.grid:last-of-type > div');
        stats.forEach((stat, idx) => {
          stat.classList.add('reveal-on-scroll');
          stat.classList.add(`stagger-delay-${(idx % 4) * 100}`);
          observer.observe(stat);
        });
      }

      // 2. Features section additional cards
      const featuresSec = document.querySelector('#features');
      if (featuresSec) {
        const toggleButton = featuresSec.querySelector('button');
        if (toggleButton) {
          toggleButton.addEventListener('click', () => {
            setTimeout(() => {
              const addCards = featuresSec.querySelectorAll('.grid:last-of-type > div');
              addCards.forEach((card, idx) => {
                if (!card.classList.contains('reveal-on-scroll')) {
                  card.classList.add('reveal-on-scroll');
                  card.classList.add(`stagger-delay-${(idx % 4) * 100}`);
                  observer.observe(card);
                }
              });
            }, 150);
          });
        }
      }

      // 3. Gallery section
      const gallerySec = document.querySelector('#gallery');
      if (gallerySec) {
        const title = gallerySec.querySelector('h2');
        const underline = gallerySec.querySelector('.w-16');
        const desc = gallerySec.querySelector('p');
        if (title) { title.classList.add('reveal-on-scroll'); observer.observe(title); }
        if (underline) { underline.classList.add('reveal-on-scroll', 'stagger-delay-100'); observer.observe(underline); }
        if (desc) { desc.classList.add('reveal-on-scroll', 'stagger-delay-200'); observer.observe(desc); }

        const slides = gallerySec.querySelectorAll('.group');
        slides.forEach((slide, idx) => {
          slide.classList.add('reveal-scale');
          slide.classList.add(`stagger-delay-${(idx % 3) * 150}`);
          observer.observe(slide);
        });
      }

      // 4. Admission section
      const admissionSec = document.querySelector('#admission');
      if (admissionSec) {
        const title = admissionSec.querySelector('h2');
        const underline = admissionSec.querySelector('.w-16');
        const desc = admissionSec.querySelector('p');
        if (title) { title.classList.add('reveal-on-scroll'); observer.observe(title); }
        if (underline) { underline.classList.add('reveal-on-scroll', 'stagger-delay-100'); observer.observe(underline); }
        if (desc) { desc.classList.add('reveal-on-scroll', 'stagger-delay-200'); observer.observe(desc); }

        const formInputs = admissionSec.querySelectorAll('input, select, textarea, button, label');
        formInputs.forEach((input, idx) => {
          input.classList.add('reveal-on-scroll');
          input.classList.add(`stagger-delay-${(idx % 4) * 50}`);
          observer.observe(input);
        });
      }

      // 5. Contact section
      const contactSec = document.querySelector('#contact');
      if (contactSec) {
        const title = contactSec.querySelector('h2');
        const underline = contactSec.querySelector('.w-16');
        const desc = contactSec.querySelector('p');
        if (title) { title.classList.add('reveal-on-scroll'); observer.observe(title); }
        if (underline) { underline.classList.add('reveal-on-scroll', 'stagger-delay-100'); observer.observe(underline); }
        if (desc) { desc.classList.add('reveal-on-scroll', 'stagger-delay-200'); observer.observe(desc); }

        const cols = contactSec.querySelectorAll('.grid > div');
        cols.forEach((col, idx) => {
          col.classList.add('reveal-on-scroll');
          col.classList.add(`stagger-delay-${idx * 200}`);
          observer.observe(col);
          
          const items = col.querySelectorAll('input, textarea, button, .flex');
          items.forEach((item, itemIdx) => {
            item.classList.add('reveal-on-scroll');
            item.classList.add(`stagger-delay-${(itemIdx % 5) * 50}`);
            observer.observe(item);
          });
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [content]);

  const settings = content?.settings || {
    showHero: true,
    showAbout: true,
    showFeatures: true,
    showGallery: true,
    showAdmission: true,
    showContact: true
  };

  return (
    <div
      className="font-poppins min-h-screen flex flex-col"
      data-theme={isDark ? 'dark' : 'light'}
      style={{ transition: 'background-color 0.3s ease, color 0.3s ease' }}
    >
      <Header />
      <main className="flex-grow">
        {settings.showHero && <Hero />}
        {settings.showAbout && <About />}
        {settings.showFeatures && <Features />}
        {settings.showGallery && <Gallery />}
        {settings.showAdmission && <Admission />}
        {settings.showContact && <Contact />}
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
