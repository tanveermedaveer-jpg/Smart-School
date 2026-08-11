import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  FileSignature, 
  Users,
  Building2,
  BookOpen,
  ClipboardList,
  BarChart3,
  Clock,
  Bell,
  UserCog,
  KeyRound,
  FileBarChart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/* ─── Inline keyframe styles (injected once) ─── */
const animationStyles = `
@keyframes featureFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes featureSlideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes featurePulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}
@keyframes showcaseFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
.feature-fade-up  { animation: featureFadeUp .6s ease-out both; }
.feature-slide-in { animation: featureSlideIn .5s ease-out both; }
.showcase-float   { animation: showcaseFloat 5s ease-in-out infinite; }
`;

const Features = () => {
  const [showMore, setShowMore] = useState(false);
  const [visibleCards, setVisibleCards] = useState([]);
  const [sectionVisible, setSectionVisible] = useState(false);
  const showcaseRef = useRef(null);

  /* Intersection Observer for scroll-triggered entrance */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setSectionVisible(true); },
      { threshold: 0.15 }
    );
    if (showcaseRef.current) observer.observe(showcaseRef.current);
    return () => observer.disconnect();
  }, []);

  /* Stagger card reveal when section is visible */
  useEffect(() => {
    if (!sectionVisible) return;
    const timers = primaryCards.map((_, i) =>
      setTimeout(() => setVisibleCards(prev => [...prev, i]), i * 120)
    );
    return () => timers.forEach(clearTimeout);
  }, [sectionVisible]);

  /* ── 5 Primary showcase cards ── */
  const primaryCards = [
    {
      num: "01",
      title: "School Setup & Administration",
      desc: "School setup, school information, School Admin assignment and school-level management.",
      Icon: Building2,
      gradient: "from-[#0B2E59] to-[#164278]"
    },
    {
      num: "02",
      title: "Role-Based User Portals",
      desc: "Super Admin, School Admin, Teacher, Student and Parent access according to their roles and permissions.",
      Icon: Users,
      gradient: "from-[#10b981] to-[#059669]"
    },
    {
      num: "03",
      title: "Academic Management",
      desc: "Classes, subjects, teacher assignments, students, homework and timetable management.",
      Icon: BookOpen,
      gradient: "from-[#0B2E59] to-[#164278]"
    },
    {
      num: "04",
      title: "Attendance, Fees & Exams",
      desc: "Attendance records, fee structure, fee collection, examinations, marks and results.",
      Icon: ClipboardList,
      gradient: "from-[#10b981] to-[#059669]"
    },
    {
      num: "05",
      title: "Reports, Notices & Monitoring",
      desc: "Dashboards, reports, report cards, merit lists, notices and school management information.",
      Icon: BarChart3,
      gradient: "from-[#0B2E59] to-[#164278]"
    }
  ];

  /* ── Additional existing features (Show More) ── */
  const additionalCards = [
    {
      title: "Online Admission",
      desc: "Student registration and application processing from the website.",
      Icon: UserPlus
    },
    {
      title: "Homework Management",
      desc: "Assign, track and review homework across teachers, students and parents.",
      Icon: FileSignature
    },
    {
      title: "Timetable Management",
      desc: "Class timetables accessible to teachers, students and parents.",
      Icon: Clock
    },
    {
      title: "Notices & Communication",
      desc: "School notices and announcements for all user roles.",
      Icon: Bell
    },
    {
      title: "Profile Management",
      desc: "Personal profile viewing and management for every user role.",
      Icon: UserCog
    },
    {
      title: "Password & Security",
      desc: "Force password change, password recovery and account security.",
      Icon: KeyRound
    },
    {
      title: "Result Processing",
      desc: "Exam results, report cards, merit lists and result reports.",
      Icon: FileBarChart
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50 relative">
      {/* Inject keyframe animations */}
      <style>{animationStyles}</style>

      <div className="container mx-auto px-6 relative z-10">

        {/* ════════════════════════════════════════════════════════
            PREMIUM SHOWCASE — "Complete School Management"
            ════════════════════════════════════════════════════════ */}
        <div
          ref={showcaseRef}
          className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-gray-100"
        >
          {/* Subtle decorative background shapes */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-green-50 rounded-full opacity-40" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#0B2E59]/[0.03] rounded-full" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-green-50/50 rounded-full" />
          </div>

          <div className="relative z-10 p-8 lg:p-12 xl:p-16">

            {/* ── Top Row: Heading + Illustration  |  Cards ── */}
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

              {/* LEFT — Heading, description, illustration */}
              <div
                className={`lg:w-[38%] flex flex-col ${sectionVisible ? 'feature-slide-in' : 'opacity-0'}`}
              >
                <div className="mb-8">
                  <p className="text-greenAccent font-semibold text-sm tracking-wider uppercase mb-3">
                    Complete Platform
                  </p>
                  <h2 className="text-3xl lg:text-[2.5rem] font-bold text-darkBlue leading-tight mb-5">
                    Everything You Need for Complete School Management
                  </h2>
                  <div className="w-16 h-1 bg-greenAccent rounded-full mb-5" />
                  <p className="text-gray-500 leading-relaxed text-[15px]">
                    Manage your school, teachers, students, parents, academics
                    and daily operations from one connected platform.
                  </p>
                </div>

                {/* Educational illustration */}
                <div className="relative mt-auto hidden lg:block">
                  <div className="rounded-2xl overflow-hidden shadow-[0_4px_24px_rgb(0,0,0,0.08)] border border-gray-100 showcase-float">
                    <img
                      src="/school_illustration.jpg"
                      alt="Smart School Management illustration"
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </div>
                  {/* Decorative badge */}
                  <div className="absolute -bottom-3 -right-3 bg-greenAccent text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
                    All-in-One
                  </div>
                </div>
              </div>

              {/* RIGHT — Five primary cards */}
              <div className="lg:w-[62%]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {primaryCards.map((card, idx) => {
                    const CardIcon = card.Icon;
                    return (
                      <div
                        key={idx}
                        className={`group relative bg-white rounded-2xl p-6 border border-gray-100
                          shadow-[0_2px_12px_rgb(0,0,0,0.04)]
                          hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)]
                          hover:-translate-y-1
                          transition-all duration-300
                          ${idx === 4 ? 'sm:col-span-2 sm:max-w-md sm:mx-auto' : ''}
                          ${visibleCards.includes(idx) ? 'feature-fade-up' : 'opacity-0'}`}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        {/* Card number */}
                        <span className="absolute top-4 right-5 text-[42px] font-extrabold text-gray-100/70 leading-none select-none group-hover:text-greenAccent/10 transition-colors duration-300">
                          {card.num}
                        </span>

                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                          <CardIcon className="w-5 h-5 text-white" />
                        </div>

                        {/* Content */}
                        <h3 className="text-base font-bold text-darkBlue mb-2 pr-8 leading-snug">
                          {card.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Show More / Additional Cards ── */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                showMore ? 'max-h-[2000px] opacity-100 mt-10' : 'max-h-0 opacity-0 mt-0'
              }`}
            >
              {/* Separator */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Additional Features</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {additionalCards.map((card, idx) => {
                  const CardIcon = card.Icon;
                  return (
                    <div
                      key={idx}
                      className="group bg-gray-50/70 hover:bg-white rounded-xl p-5 border border-gray-100
                        hover:shadow-[0_6px_24px_rgb(0,0,0,0.08)]
                        hover:-translate-y-0.5
                        transition-all duration-300"
                      style={{
                        animation: showMore ? `featureFadeUp .5s ease-out ${idx * 0.08}s both` : 'none'
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center mb-3 group-hover:bg-greenAccent group-hover:border-greenAccent transition-colors duration-300 shadow-sm">
                        <CardIcon className="w-4 h-4 text-greenAccent group-hover:text-white transition-colors duration-300" />
                      </div>
                      <h4 className="text-sm font-bold text-darkBlue mb-1.5">{card.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Toggle Button ── */}
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setShowMore(!showMore)}
                className="group inline-flex items-center gap-2.5 bg-darkBlue hover:bg-[#164278] text-white px-8 py-3.5 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <span>{showMore ? 'Show Less' : 'Show More'}</span>
                {showMore ? (
                  <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-300" />
                ) : (
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-300" />
                )}
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Features;
