import React, { useState, useEffect } from 'react';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';
import { FaFacebookF, FaTwitter, FaYoutube, FaLinkedinIn, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const [content, setContent] = useState({
    footer: {
      description: "Empowering schools with innovative digital solutions for better administration, communication and student success.",
      copyright: "Smart School Management System. All Rights Reserved.",
      privacyPolicy: "",
      termsConditions: ""
    },
    contact: {
      email: "muhammadsadaf010@gmail.com",
      phone: "03103716116",
      facebook: "",
      twitter: "",
      youtube: "",
      linkedin: "",
      instagram: ""
    },
    branding: {
      websiteName: "Smart School",
      tagline: "Management System",
      logo: ""
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem('websiteContent');
    if (saved) {
      const parsed = JSON.parse(saved);
      setContent({
        footer: parsed.footer || content.footer,
        contact: parsed.contact || content.contact,
        branding: parsed.branding || content.branding
      });
    }
  }, []);

  return (
    <footer className="bg-darkBlue text-white pt-16 pb-8 border-t-4 border-greenAccent">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-full flex items-center justify-center w-10 h-10">
                {content.branding.logo ? (
                  <img src={content.branding.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <BookOpen className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">{content.branding.websiteName}</span>
                <span className="text-xs font-light text-gray-300 leading-tight">{content.branding.tagline}</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mt-4">
              {content.footer.description}
            </p>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#home" className="text-gray-400 hover:text-greenAccent transition-colors text-sm flex items-center space-x-2"><span className="w-1 h-1 bg-greenAccent rounded-full"></span><span>Home</span></a></li>
              <li><a href="#about" className="text-gray-400 hover:text-greenAccent transition-colors text-sm flex items-center space-x-2"><span className="w-1 h-1 bg-greenAccent rounded-full"></span><span>About</span></a></li>
              <li><a href="#features" className="text-gray-400 hover:text-greenAccent transition-colors text-sm flex items-center space-x-2"><span className="w-1 h-1 bg-greenAccent rounded-full"></span><span>Features</span></a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Explore</h4>
            <ul className="space-y-3">
              <li><a href="#admission" className="text-gray-400 hover:text-greenAccent transition-colors text-sm flex items-center space-x-2"><span className="w-1 h-1 bg-greenAccent rounded-full"></span><span>Online Admission</span></a></li>
              <li><a href="#gallery" className="text-gray-400 hover:text-greenAccent transition-colors text-sm flex items-center space-x-2"><span className="w-1 h-1 bg-greenAccent rounded-full"></span><span>Gallery</span></a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-greenAccent transition-colors text-sm flex items-center space-x-2"><span className="w-1 h-1 bg-greenAccent rounded-full"></span><span>Contact</span></a></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-sm text-gray-400">
                <Mail className="w-5 h-5 text-greenAccent shrink-0 mt-0.5" />
                <span className="break-all">{content.contact.email}</span>
              </li>
              <li className="flex items-start space-x-3 text-sm text-gray-400">
                <Phone className="w-5 h-5 text-greenAccent shrink-0 mt-0.5" />
                <span>{content.contact.phone}</span>
              </li>
              <li className="flex items-start space-x-3 text-sm text-gray-400">
                <MapPin className="w-5 h-5 text-greenAccent shrink-0 mt-0.5" />
                <span>D I Khan City, Pakistan</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} {content.footer.copyright}
          </p>
          <div className="flex space-x-4">
            {content.footer.privacyPolicy && <a href={content.footer.privacyPolicy} className="text-xs text-gray-400 hover:text-white transition-colors">Privacy Policy</a>}
            {content.footer.termsConditions && <a href={content.footer.termsConditions} className="text-xs text-gray-400 hover:text-white transition-colors">Terms & Conditions</a>}
            
            {content.contact.facebook && (
              <a href={content.contact.facebook} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-greenAccent flex items-center justify-center transition-colors">
                <FaFacebookF className="w-4 h-4 text-white" />
              </a>
            )}
            {content.contact.youtube && (
              <a href={content.contact.youtube} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-greenAccent flex items-center justify-center transition-colors">
                <FaYoutube className="w-4 h-4 text-white" />
              </a>
            )}
            {content.contact.linkedin && (
              <a href={content.contact.linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-greenAccent flex items-center justify-center transition-colors">
                <FaLinkedinIn className="w-4 h-4 text-white" />
              </a>
            )}
            {content.contact.instagram && (
              <a href={content.contact.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-greenAccent flex items-center justify-center transition-colors">
                <FaInstagram className="w-4 h-4 text-white" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
