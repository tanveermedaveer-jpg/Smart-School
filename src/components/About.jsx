import React, { useState, useEffect } from 'react';
import { Target, Compass, BookOpen, Building2, Users, GraduationCap, Activity } from 'lucide-react';

const About = () => {
  const [content, setContent] = useState({
    intro: "We are a premier educational technology provider dedicated to transforming how schools operate. Our integrated platform brings administrators, teachers, parents, and students together in one seamless digital ecosystem.",
    mission: "To eliminate administrative friction so educators can focus on what truly matters: inspiring and guiding the next generation. We strive to make robust school management accessible to every institution.",
    vision: "To be the global standard for educational administration, pioneering smart algorithms and intuitive interfaces that redefine the modern educational experience worldwide.",
    stat1Value: "500+", stat1Label: "Partner Schools",
    stat2Value: "150k+", stat2Label: "Active Students",
    stat3Value: "10k+", stat3Label: "Teachers Enrolled",
    stat4Value: "99.9%", stat4Label: "System Uptime",
    aboutImage: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem('websiteContent');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.about) setContent(parsed.about);
    }
  }, []);

  return (
    <section id="about" className="py-24 bg-white relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-darkBlue mb-4">About Smart School</h2>
          <div className="w-16 h-1 bg-greenAccent mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            Empowering educational institutions with next-generation digital tools to streamline administration, enhance learning, and foster stronger school communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Company Introduction */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <Building2 className="text-darkBlue w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-darkBlue mb-4">Who We Are</h3>
            <p className="text-gray-600 leading-relaxed">
              {content.intro}
            </p>
          </div>

          {/* Mission */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6">
              <Target className="text-greenAccent w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-darkBlue mb-4">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              {content.mission}
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <Compass className="text-darkBlue w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-darkBlue mb-4">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed">
              {content.vision}
            </p>
          </div>
        </div>

        {content.aboutImage && (
          <div className="mb-20 flex justify-center">
            <img src={content.aboutImage} alt="About Us" className="rounded-2xl shadow-lg max-w-full h-auto object-cover max-h-[400px]" />
          </div>
        )}

        {/* Statistics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-darkBlue text-white rounded-2xl p-6 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex flex-col items-center">
              <Building2 className="w-8 h-8 text-greenAccent mb-3" />
              <div className="text-3xl font-extrabold mb-1">{content.stat1Value}</div>
              <div className="text-sm text-blue-200 font-medium">{content.stat1Label}</div>
            </div>
          </div>
          
          <div className="bg-darkBlue text-white rounded-2xl p-6 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex flex-col items-center">
              <Users className="w-8 h-8 text-greenAccent mb-3" />
              <div className="text-3xl font-extrabold mb-1">{content.stat2Value}</div>
              <div className="text-sm text-blue-200 font-medium">{content.stat2Label}</div>
            </div>
          </div>

          <div className="bg-darkBlue text-white rounded-2xl p-6 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex flex-col items-center">
              <GraduationCap className="w-8 h-8 text-greenAccent mb-3" />
              <div className="text-3xl font-extrabold mb-1">{content.stat3Value}</div>
              <div className="text-sm text-blue-200 font-medium">{content.stat3Label}</div>
            </div>
          </div>

          <div className="bg-darkBlue text-white rounded-2xl p-6 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex flex-col items-center">
              <Activity className="w-8 h-8 text-greenAccent mb-3" />
              <div className="text-3xl font-extrabold mb-1">{content.stat4Value}</div>
              <div className="text-sm text-blue-200 font-medium">{content.stat4Label}</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default About;
