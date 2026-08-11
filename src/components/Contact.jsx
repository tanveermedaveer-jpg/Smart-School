import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [settings, setSettings] = useState({
    email: 'muhammadsadaf010@gmail.com',
    phone: '03103716116',
    address: 'D I Khan City, Khyber Pakhtunkhwa, Pakistan',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d107384.80287113192!2d70.82500030501174!3d31.831518349129532!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39260c6d5462c0eb%3A0xc3911f9d4bbdbad3!2sDera%20Ismail%20Khan%2C%20Khyber%20Pakhtunkhwa%2C%20Pakistan!5e0!3m2!1sen!2s!4v1715000000000!5m2!1sen!2s'
  });

  useEffect(() => {
    const saved = localStorage.getItem('websiteContent');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.contact) {
        setSettings({
          ...parsed.contact,
          mapEmbedUrl: parsed.contact.mapEmbedUrl || parsed.contact.mapIframe
        });
      }
    } else {
      // Fallback to old siteSettings if websiteContent doesn't exist yet
      const data = JSON.parse(localStorage.getItem('siteSettings'));
      if (data) setSettings(data);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const existingMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    const newMessage = {
      ...formData,
      id: Date.now(),
      date: new Date().toISOString(),
      subject: 'General Inquiry' // Default subject
    };
    localStorage.setItem('contactMessages', JSON.stringify([newMessage, ...existingMessages]));
    toast.success('Message sent successfully!');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-darkBlue mb-4">Contact Us</h2>
          <div className="w-16 h-1 bg-greenAccent mx-auto rounded-full mb-6"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Contact Info and Form */}
          <div className="w-full lg:w-1/2 space-y-10">
            {/* Info Placeholders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <Mail className="w-6 h-6 text-greenAccent mb-3" />
                <h4 className="font-semibold text-gray-700 mb-1">Email</h4>
                <a href={`mailto:${settings.email}`} className="text-sm text-gray-400 break-all hover:text-greenAccent transition-colors">{settings.email}</a>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <Phone className="w-6 h-6 text-greenAccent mb-3" />
                <h4 className="font-semibold text-gray-700 mb-1">Phone</h4>
                <a href={`tel:${settings.phone}`} className="text-sm text-gray-400 hover:text-greenAccent transition-colors">{settings.phone}</a>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <MapPin className="w-6 h-6 text-greenAccent mb-3" />
                <h4 className="font-semibold text-gray-700 mb-1">Address</h4>
                <p className="text-sm text-gray-400">{settings.address}</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-darkBlue mb-6">Send us a message</h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Name</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-greenAccent focus:border-transparent transition-all" placeholder="Your Name" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-greenAccent focus:border-transparent transition-all" placeholder="Your Email" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Message</label>
                  <textarea required rows="4" name="message" value={formData.message} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-greenAccent focus:border-transparent transition-all resize-none" placeholder="How can we help you?"></textarea>
                </div>
                <button type="submit" className="bg-darkBlue hover:bg-blue-900 text-white px-8 py-3 rounded-lg font-medium w-full sm:w-auto shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="w-full lg:w-1/2">
            <div className="h-full min-h-[400px] bg-gray-200 border border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center overflow-hidden relative">
              {settings.mapEmbedUrl ? (
                <iframe 
                  src={settings.mapEmbedUrl} 
                  width="100%" 
                  height="100%" 
                  style={{border: 0, position: 'absolute', inset: 0}} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              ) : (
                <div className="p-6">
                  <MapPin className="w-12 h-12 text-gray-400 mb-4 mx-auto" />
                  <h3 className="text-xl font-medium text-gray-500 mb-2">Map Placeholder</h3>
                  <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    Interactive map will be integrated here based on Super Admin configurations. Provide a map iframe URL in Settings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
