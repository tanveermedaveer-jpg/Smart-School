import React, { useState, useEffect } from 'react';
import { Calendar, Phone, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import heroImg from '../assets/hero_new.jpg';

const Hero = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState({
    heading: "Complete Digital",
    headingHighlight: "School Management Solution",
    subHeading: "An integrated digital platform for efficient administration, student management, and parent communication.",
    requestDemoText: "Request a Demo",
    contactUsText: "Contact Us",
    enableBanner: true
  });
  
  const [formData, setFormData] = useState({
    name: '',
    schoolName: '',
    email: '',
    phone: '',
    students: '',
    message: ''
  });

  useEffect(() => {
    // Content settings
    const savedContent = localStorage.getItem('websiteContent');
    if (savedContent) {
      const parsed = JSON.parse(savedContent);
      if (parsed.hero) {
        setContent(parsed.hero);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const existingRequests = JSON.parse(localStorage.getItem('demoRequests') || '[]');
    const newRequest = {
      ...formData,
      id: Date.now(),
      date: new Date().toISOString(),
    };
    localStorage.setItem('demoRequests', JSON.stringify([newRequest, ...existingRequests]));
    toast.success('Demo request submitted successfully!');
    setIsModalOpen(false);
    setFormData({ name: '', schoolName: '', email: '', phone: '', students: '', message: '' });
  };

  return (
    <>
      <section id="home" className="relative w-full bg-white overflow-hidden py-12 lg:py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            
            {/* LEFT COLUMN: Image & Urdu */}
            <div className="w-full lg:w-1/2 flex flex-col items-center relative animate-in fade-in slide-in-from-left-8 duration-1000">
              {content.enableBanner && (
                <div className="relative w-full max-w-2xl lg:-ml-8 lg:scale-110 xl:scale-115">
                  {/* The image with a soft gradient mask fading right/bottom */}
                  <img 
                    src={heroImg} 
                    alt="Students Studying" 
                    className="w-full h-auto object-cover rounded-2xl animate-pulse-subtle"
                    style={{ maskImage: 'radial-gradient(ellipse at center, black 65%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 65%, transparent 100%)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white pointer-events-none hidden lg:block"></div>
                </div>
              )}
              <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 w-full max-w-md">
                <div dir="rtl" className="inline-block relative">
                  <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-bold text-darkBlue font-urdu leading-snug tracking-wide">
                    اسکول منیجمنٹ کا جدید ڈیجیٹل حل
                  </h2>
                  <div className="mt-3 flex justify-center w-full">
                    <svg width="220" height="15" viewBox="0 0 220 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 10Q110 -5 215 10" stroke="#22c55e" strokeWidth="4" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Content */}
            <div className="w-full lg:w-1/2 flex flex-col items-start text-left animate-in fade-in slide-in-from-right-8 duration-1000">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-darkBlue leading-[1.15] tracking-tight mb-6 drop-shadow-sm">
                Complete Digital<br />
                School Management Solution
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed max-w-xl mb-8">
                An integrated digital platform for efficient administration, student management, and parent communication.
              </p>

              <div className="flex items-center space-x-4 bg-green-50 p-4 rounded-xl border border-green-100 mb-10 transform transition-transform hover:scale-105">
                <div className="bg-greenAccent/10 p-3 rounded-full text-greenAccent">
                  <Users className="w-8 h-8" />
                </div>
                <p className="text-green-700 font-bold text-sm md:text-base leading-snug max-w-md">
                  One System, Multiple Roles – Admin, Principal, Teacher, Student & Parent Access.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-darkBlue hover:bg-blue-900 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center space-x-3 group"
                >
                  <Calendar className="w-5 h-5 group-hover:animate-bounce" />
                  <span>Request a Demo</span>
                </button>
                
                <a 
                  href="#contact"
                  className="bg-white hover:bg-gray-50 text-darkBlue border-2 border-darkBlue px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-1 flex items-center justify-center space-x-3 group"
                >
                  <Phone className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Contact Us</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Demo Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">Request a Demo</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input required type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Students</label>
                <select required name="students" value={formData.students} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all bg-white">
                  <option value="">Select an option</option>
                  <option value="1-100">1 - 100</option>
                  <option value="101-500">101 - 500</option>
                  <option value="501-1000">501 - 1000</option>
                  <option value="1000+">More than 1000</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Message</label>
                <textarea rows="3" name="message" value={formData.message} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all resize-none"></textarea>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-greenAccent hover:bg-green-600 text-white font-semibold py-3 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Hero;
