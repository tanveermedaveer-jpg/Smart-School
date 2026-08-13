import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, Image as ImageIcon, Layout, Settings, Link as LinkIcon, Info, MessageSquare, Search, ShieldCheck } from 'lucide-react';

const defaultSettings = {
  hero: {
    heading: "Complete Digital",
    headingHighlight: "School Management Solution",
    subHeading: "An integrated digital platform for efficient administration, student management, and parent communication.",
    requestDemoText: "Request a Demo",
    contactUsText: "Contact Us",
    enableBanner: true,
    bannerImage: ""
  },
  about: {
    intro: "We are a premier educational technology provider dedicated to transforming how schools operate. Our integrated platform brings administrators, teachers, parents, and students together in one seamless digital ecosystem.",
    mission: "To eliminate administrative friction so educators can focus on what truly matters: inspiring and guiding the next generation. We strive to make robust school management accessible to every institution.",
    vision: "To be the global standard for educational administration, pioneering smart algorithms and intuitive interfaces that redefine the modern educational experience worldwide.",
    stat1Value: "500+", stat1Label: "Partner Schools",
    stat2Value: "150k+", stat2Label: "Active Students",
    stat3Value: "10k+", stat3Label: "Teachers Enrolled",
    stat4Value: "99.9%", stat4Label: "System Uptime",
    aboutImage: ""
  },
  contact: {
    email: "muhammadsaadweb10@gmail.com",
    phone: "03103716116",
    whatsapp: "",
    address: "D I Khan City, Pakistan",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d107384.80287113192!2d70.82500030501174!3d31.831518349129532!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39260c6d5462c0eb%3A0xc3911f9d4bbdbad3!2sDera%20Ismail%20Khan%2C%20Khyber%20Pakhtunkhwa%2C%20Pakistan!5e0!3m2!1sen!2s!4v1715000000000!5m2!1sen!2s",
    facebook: "",
    instagram: "",
    youtube: "",
    linkedin: ""
  },
  footer: {
    description: "Empowering schools with innovative digital solutions for better administration, communication and student success.",
    copyright: "Smart School Management System. All Rights Reserved.",
    privacyPolicy: "",
    termsConditions: ""
  },
  settings: {
    showHero: true,
    showAbout: true,
    showFeatures: true,
    showGallery: true,
    showAdmission: true,
    showContact: true,
    enableAdmissions: false
  },
  branding: {
    logo: "",
    favicon: "",
    websiteName: "Smart School",
    tagline: "Management System"
  },
  seo: {
    title: "Smart School Management System",
    description: "Complete Digital School Management Solution",
    keywords: "school, management, system, education, erp",
    ogImage: ""
  }
};

const WebsiteContentManagement = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [data, setData] = useState(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem('websiteContent');
    if (saved) {
      // Merge with defaultSettings to ensure all keys exist
      const parsedSaved = JSON.parse(saved);
      const mergedData = { ...defaultSettings };
      for (const key in defaultSettings) {
        if (parsedSaved[key]) {
          mergedData[key] = { ...defaultSettings[key], ...parsedSaved[key] };
        }
      }
      setData(mergedData);
    } else {
      localStorage.setItem('websiteContent', JSON.stringify(defaultSettings));
    }
  }, []);

  const handleInputChange = (section, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleImageUpload = (section, field, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange(section, field, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem('websiteContent', JSON.stringify(data));
    toast.success('Website content updated successfully!');
  };

  const tabs = [
    { id: 'hero', label: 'Hero Section', icon: <Layout size={18} /> },
    { id: 'about', label: 'About Section', icon: <Info size={18} /> },
    { id: 'contact', label: 'Contact Info', icon: <MessageSquare size={18} /> },
    { id: 'footer', label: 'Footer', icon: <LinkIcon size={18} /> },
    { id: 'settings', label: 'Homepage Settings', icon: <Settings size={18} /> },
    { id: 'branding', label: 'Branding', icon: <ShieldCheck size={18} /> },
    { id: 'seo', label: 'SEO', icon: <Search size={18} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Website Content Management</h2>
        <button 
          onClick={handleSave}
          className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center space-x-2"
        >
          <Save size={20} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 shrink-0">
          <nav className="space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                  activeTab === tab.id 
                    ? 'bg-white shadow-sm border border-gray-200 text-darkBlue font-semibold' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-greenAccent' : 'text-gray-400'}>{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          
          {/* HERO SECTION */}
          {activeTab === 'hero' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-semibold text-darkBlue mb-4 border-b pb-2">Hero Section Settings</h3>
              
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-800">Enable Hero Banner Image</h4>
                  <p className="text-sm text-gray-500">Show a banner image behind the hero section.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={data.hero.enableBanner} onChange={(e) => handleInputChange('hero', 'enableBanner', e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-greenAccent"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Hero Banner</label>
                <div className="flex items-center space-x-4">
                  {data.hero.bannerImage && (
                    <div className="relative group">
                      <img src={data.hero.bannerImage} alt="Hero Banner" className="w-32 h-20 object-cover rounded-lg border" />
                      <button 
                        onClick={() => handleInputChange('hero', 'bannerImage', '')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Banner"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2">
                    <ImageIcon size={16} />
                    <span>Choose Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('hero', 'bannerImage', e.target.files[0])} />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Recommended size: 1920x1080px. Used strictly for the homepage hero background.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Heading</label>
                  <input type="text" value={data.hero.heading} onChange={(e) => handleInputChange('hero', 'heading', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heading Highlight (Colored)</label>
                  <input type="text" value={data.hero.headingHighlight} onChange={(e) => handleInputChange('hero', 'headingHighlight', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Heading</label>
                <textarea rows="3" value={data.hero.subHeading} onChange={(e) => handleInputChange('hero', 'subHeading', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Demo Button Text</label>
                  <input type="text" value={data.hero.requestDemoText} onChange={(e) => handleInputChange('hero', 'requestDemoText', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Us Button Text</label>
                  <input type="text" value={data.hero.contactUsText} onChange={(e) => handleInputChange('hero', 'contactUsText', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* ABOUT SECTION */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-semibold text-darkBlue mb-4 border-b pb-2">About Section Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload About Image</label>
                <div className="flex items-center space-x-4">
                  {data.about.aboutImage && (
                    <img src={data.about.aboutImage} alt="About" className="w-20 h-20 object-cover rounded-lg border" />
                  )}
                  <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2">
                    <ImageIcon size={16} />
                    <span>Choose Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('about', 'aboutImage', e.target.files[0])} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Introduction (Who We Are)</label>
                <textarea rows="3" value={data.about.intro} onChange={(e) => handleInputChange('about', 'intro', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none resize-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Our Mission</label>
                <textarea rows="3" value={data.about.mission} onChange={(e) => handleInputChange('about', 'mission', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none resize-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Our Vision</label>
                <textarea rows="3" value={data.about.vision} onChange={(e) => handleInputChange('about', 'vision', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none resize-none"></textarea>
              </div>

              <h4 className="font-semibold text-gray-800 mt-6 mb-2">Statistics Cards</h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <input type="text" value={data.about.stat1Value} onChange={(e) => handleInputChange('about', 'stat1Value', e.target.value)} placeholder="Value (e.g. 500+)" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-greenAccent outline-none" />
                  <input type="text" value={data.about.stat1Label} onChange={(e) => handleInputChange('about', 'stat1Label', e.target.value)} placeholder="Label" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-greenAccent outline-none" />
                </div>
                <div className="space-y-2">
                  <input type="text" value={data.about.stat2Value} onChange={(e) => handleInputChange('about', 'stat2Value', e.target.value)} placeholder="Value" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-greenAccent outline-none" />
                  <input type="text" value={data.about.stat2Label} onChange={(e) => handleInputChange('about', 'stat2Label', e.target.value)} placeholder="Label" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-greenAccent outline-none" />
                </div>
                <div className="space-y-2">
                  <input type="text" value={data.about.stat3Value} onChange={(e) => handleInputChange('about', 'stat3Value', e.target.value)} placeholder="Value" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-greenAccent outline-none" />
                  <input type="text" value={data.about.stat3Label} onChange={(e) => handleInputChange('about', 'stat3Label', e.target.value)} placeholder="Label" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-greenAccent outline-none" />
                </div>
                <div className="space-y-2">
                  <input type="text" value={data.about.stat4Value} onChange={(e) => handleInputChange('about', 'stat4Value', e.target.value)} placeholder="Value" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-greenAccent outline-none" />
                  <input type="text" value={data.about.stat4Label} onChange={(e) => handleInputChange('about', 'stat4Label', e.target.value)} placeholder="Label" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-greenAccent outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* CONTACT INFO */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-semibold text-darkBlue mb-4 border-b pb-2">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
                  <input type="email" value={data.contact.email} onChange={(e) => handleInputChange('contact', 'email', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="text" value={data.contact.phone} onChange={(e) => handleInputChange('contact', 'phone', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number (Optional)</label>
                <input type="text" value={data.contact.whatsapp} onChange={(e) => handleInputChange('contact', 'whatsapp', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea rows="2" value={data.contact.address} onChange={(e) => handleInputChange('contact', 'address', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none resize-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Embed URL (src)</label>
                <input type="text" value={data.contact.mapEmbedUrl} onChange={(e) => handleInputChange('contact', 'mapEmbedUrl', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" placeholder="https://www.google.com/maps/embed?pb=..." />
              </div>

              <h4 className="font-semibold text-gray-800 mt-6 mb-2">Social Media Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                  <input type="url" value={data.contact.facebook} onChange={(e) => handleInputChange('contact', 'facebook', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                  <input type="url" value={data.contact.instagram} onChange={(e) => handleInputChange('contact', 'instagram', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                  <input type="url" value={data.contact.youtube} onChange={(e) => handleInputChange('contact', 'youtube', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input type="url" value={data.contact.linkedin} onChange={(e) => handleInputChange('contact', 'linkedin', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* FOOTER */}
          {activeTab === 'footer' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-semibold text-darkBlue mb-4 border-b pb-2">Footer Management</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Footer Description</label>
                <textarea rows="3" value={data.footer.description} onChange={(e) => handleInputChange('footer', 'description', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none resize-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Copyright Text</label>
                <input type="text" value={data.footer.copyright} onChange={(e) => handleInputChange('footer', 'copyright', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Policy Link</label>
                  <input type="url" value={data.footer.privacyPolicy} onChange={(e) => handleInputChange('footer', 'privacyPolicy', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" placeholder="/privacy-policy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions Link</label>
                  <input type="url" value={data.footer.termsConditions} onChange={(e) => handleInputChange('footer', 'termsConditions', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" placeholder="/terms" />
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-semibold text-darkBlue mb-4 border-b pb-2">Homepage Visibility Settings</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { key: 'showHero', label: 'Show Hero Section' },
                  { key: 'showAbout', label: 'Show About Section' },
                  { key: 'showFeatures', label: 'Show Features Section' },
                  { key: 'showGallery', label: 'Show Gallery' },
                  { key: 'showAdmission', label: 'Show Online Admission Section' },
                  { key: 'showContact', label: 'Show Contact Section' },
                  { key: 'enableAdmissions', label: 'Enable Online Admissions Global Toggle' }
                ].map(setting => (
                  <div key={setting.key} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-800">{setting.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={data.settings[setting.key]} onChange={(e) => handleInputChange('settings', setting.key, e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-greenAccent"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BRANDING */}
          {activeTab === 'branding' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-semibold text-darkBlue mb-4 border-b pb-2">Website Branding</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Website Logo</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border overflow-hidden">
                      {data.branding.logo ? <img src={data.branding.logo} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-400" />}
                    </div>
                    <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Choose Image
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('branding', 'logo', e.target.files[0])} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Favicon</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border overflow-hidden">
                      {data.branding.favicon ? <img src={data.branding.favicon} alt="Favicon" className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-400" />}
                    </div>
                    <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Choose Image
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('branding', 'favicon', e.target.files[0])} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website Name</label>
                  <input type="text" value={data.branding.websiteName} onChange={(e) => handleInputChange('branding', 'websiteName', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website Tagline</label>
                  <input type="text" value={data.branding.tagline} onChange={(e) => handleInputChange('branding', 'tagline', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-semibold text-darkBlue mb-4 border-b pb-2">SEO Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website Title (Title Tag)</label>
                <input type="text" value={data.seo.title} onChange={(e) => handleInputChange('seo', 'title', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea rows="3" value={data.seo.description} onChange={(e) => handleInputChange('seo', 'description', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none resize-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords (Comma separated)</label>
                <input type="text" value={data.seo.keywords} onChange={(e) => handleInputChange('seo', 'keywords', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Open Graph Image (For Social Sharing)</label>
                <div className="flex items-center space-x-4">
                  {data.seo.ogImage && (
                    <img src={data.seo.ogImage} alt="OG" className="w-32 h-20 object-cover rounded-lg border" />
                  )}
                  <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2">
                    <ImageIcon size={16} />
                    <span>Choose Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('seo', 'ogImage', e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default WebsiteContentManagement;
