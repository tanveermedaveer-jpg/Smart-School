import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Gallery = () => {
  const [schools, setSchools] = useState([]);
  const [visibleSlides, setVisibleSlides] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const { getSchools } = await import('../utils/db');
        const data = await getSchools();
        setSchools(data.filter(s => s.status === 'Active'));
        localStorage.setItem('schools', JSON.stringify(data));
      } catch (err) {
        console.error('Error loading schools in Gallery:', err);
        const data = JSON.parse(localStorage.getItem('schools') || '[]');
        setSchools(data.filter(s => s.status === 'Active'));
      }
    };
    loadSchools();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleSlides(1);
      } else if (window.innerWidth < 1024) {
        setVisibleSlides(2);
      } else {
        setVisibleSlides(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const banners = schools.filter(s => s.banner && s.featured).map(s => s.banner);
  const logos = schools.filter(s => s.logo).map(s => s.logo);
  const hasContent = banners.length > 0 || logos.length > 0;

  const defaultItems = [
    { title: "School Campus", img: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80" },
    { title: "Students in Classroom", img: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80" },
    { title: "School Events", img: "https://images.unsplash.com/photo-1511629091441-ee46146481b6?auto=format&fit=crop&w=800&q=80" },
    { title: "Computer Lab", img: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80" },
    { title: "Science Lab", img: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80" },
    { title: "Graduation Ceremony", img: "https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?auto=format&fit=crop&w=800&q=80" }
  ];

  const activeItems = hasContent 
    ? [
        ...schools.filter(s => s.banner && s.featured).map(s => ({ title: s.name || "School Banner", img: s.banner })),
        ...schools.filter(s => s.logo).map(s => ({ title: `${s.name || "School"} Logo`, img: s.logo }))
      ]
    : defaultItems;

  const maxIndex = Math.max(0, activeItems.length - visibleSlides);

  // Clamp current index when active items count changes dynamically
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [activeItems.length, maxIndex, currentIndex]);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1 > maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 < 0 ? maxIndex : prev - 1));
  };

  // Autoplay handler
  useEffect(() => {
    if (isHovered || maxIndex === 0) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Transition every 5 seconds for best usability
    return () => clearInterval(interval);
  }, [currentIndex, isHovered, maxIndex]);

  // Touch handlers for mobile gesture navigation
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <section id="gallery" className="py-20 bg-gray-50 border-t border-gray-100 overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-darkBlue mb-4">Gallery</h2>
          <div className="w-16 h-1 bg-greenAccent mx-auto rounded-full mb-6"></div>
          {!hasContent && (
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse through our campus highlights, laboratories, and student event highlights.
            </p>
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-6xl mx-auto px-2 md:px-12">
          
          <div 
            className="relative w-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Viewport wrapper */}
            <div className="overflow-hidden py-4 px-1">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translate3d(-${currentIndex * (100 / visibleSlides)}%, 0, 0)`,
                  width: `${(activeItems.length / visibleSlides) * 100}%`
                }}
              >
                {activeItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="px-3 select-none"
                    style={{ width: `${100 / activeItems.length}%` }}
                  >
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden group hover:shadow-md transition-shadow relative">
                      <div className="aspect-video relative overflow-hidden cursor-pointer">
                        <img 
                          src={item.img} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-5">
                          <h3 className="text-white font-bold tracking-wide text-[16px] drop-shadow-md">{item.title}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous Arrow Navigation */}
            {maxIndex > 0 && (
              <button 
                onClick={prevSlide}
                className="absolute left-[-8px] md:left-[-16px] top-1/2 -translate-y-1/2 w-11 h-11 bg-white hover:bg-slate-50 text-slate-800 rounded-full border border-slate-200/80 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-10"
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} className="text-slate-700" />
              </button>
            )}

            {/* Next Arrow Navigation */}
            {maxIndex > 0 && (
              <button 
                onClick={nextSlide}
                className="absolute right-[-8px] md:right-[-16px] top-1/2 -translate-y-1/2 w-11 h-11 bg-white hover:bg-slate-50 text-slate-800 rounded-full border border-slate-200/80 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-10"
                aria-label="Next slide"
              >
                <ChevronRight size={20} className="text-slate-700" />
              </button>
            )}
          </div>

          {/* Pagination Dot Indicators */}
          {maxIndex > 0 && (
            <div className="flex justify-center items-center space-x-2.5 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx 
                      ? 'bg-greenAccent w-6' 
                      : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide page ${idx + 1}`}
                />
              ))}
            </div>
          )}

        </div>

      </div>
    </section>
  );
};

export default Gallery;
