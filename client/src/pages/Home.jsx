import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera, BarChart3, Users, Shield, Clock, DollarSign, Target, Eye, FileText, ArrowRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ projects: 0, kilometers: 0, accuracy: 0 });
  const statsRef = useRef(false);

  // Animate stats on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !statsRef.current) {
            statsRef.current = true;
            animateStats();
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsElement = document.getElementById('stats-section');
    if (statsElement) {
      observer.observe(statsElement);
    }

    return () => {
      if (statsElement) {
        observer.unobserve(statsElement);
      }
    };
  }, []);

  const animateStats = () => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;

      setStats({
        projects: Math.floor(1000 * progress),
        kilometers: Math.floor(50000 * progress),
        accuracy: Math.floor(95 * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setStats({ projects: 1000, kilometers: 50000, accuracy: 95 });
      }
    }, interval);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/" className="text-2xl font-bold text-blue-600">
            🛣️ BetterRoad
          </a>
          <ul className="hidden md:flex gap-8">
            <li><a href="#features" className="text-gray-700 hover:text-blue-600 transition">Features</a></li>
            <li><a href="#benefits" className="text-gray-700 hover:text-blue-600 transition">Benefits</a></li>
            <li><a href="#process" className="text-gray-700 hover:text-blue-600 transition">Process</a></li>
            <li><a href="#contact" className="text-gray-700 hover:text-blue-600 transition">Contact</a></li>
          </ul>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Login
          </button>
        </nav>
      </header>

      {/* Hero Section with Video Background */}
      <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/videos/road-management.mp4" type="video/mp4" />
            {/* Fallback gradient if video doesn't load */}
          </video>
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-blue-900/70"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Smart Road<br />Management System
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto drop-shadow-md">
            Transform Your Infrastructure with AI-Powered Damage Detection. Cut Costs by 40%, Save 20+ Hours Weekly, and Make Data-Driven Decisions with Confidence.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/register')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105 shadow-xl flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-lg text-lg font-semibold border-2 border-white/30 hover:bg-white/20 transition"
            >
              Login
            </button>
          </div>

          {/* Stats */}
          <div id="stats-section" className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white/20">
              <div className="text-4xl font-bold text-blue-300 mb-2">
                {stats.projects}+
              </div>
              <div className="text-blue-100 font-medium">Successful Deployments Worldwide</div>
              <div className="text-sm text-blue-200 mt-1">Trusted by leading infrastructure organizations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white/20">
              <div className="text-4xl font-bold text-blue-300 mb-2">
                {stats.kilometers.toLocaleString()}+
              </div>
              <div className="text-blue-100 font-medium">Kilometers Monitored Daily</div>
              <div className="text-sm text-blue-200 mt-1">Real-time tracking across entire road networks</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white/20">
              <div className="text-4xl font-bold text-blue-300 mb-2">
                {stats.accuracy}%
              </div>
              <div className="text-blue-100 font-medium">AI Detection Accuracy</div>
              <div className="text-sm text-blue-200 mt-1">Industry-leading precision in damage identification</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4">
              Outstanding Features
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Revolutionary AI technology that transforms how you manage infrastructure. Stop guessing—start knowing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-600 p-8 rounded-2xl text-white transform hover:scale-105 transition shadow-xl">
              <Camera className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Zero-Effort Data Collection</h3>
              <p className="text-blue-100 leading-relaxed">
                Eliminate manual inspections forever. Our system automatically captures high-resolution images and precise GPS coordinates every 10 feet while you drive. No training required—just drive and let AI do the work.
              </p>
            </div>

            <div className="bg-blue-700 p-8 rounded-2xl text-white transform hover:scale-105 transition shadow-xl">
              <BarChart3 className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Military-Grade AI Detection</h3>
              <p className="text-blue-100 leading-relaxed">
                Identify 5 critical damage types with 95% accuracy—cracks, potholes, rutting, raveling, and depressions. Get instant severity classification that helps you prioritize repairs and allocate resources intelligently.
              </p>
            </div>

            <div className="bg-blue-800 p-8 rounded-2xl text-white transform hover:scale-105 transition shadow-xl">
              <MapPin className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Live Command Center</h3>
              <p className="text-blue-100 leading-relaxed">
                See your entire road network at a glance. Real-time damage mapping with repair status tracking. Make informed decisions instantly with visual dashboards that show exactly where action is needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section with Images */}
      <section id="benefits" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4">
              Our Secret Sauce
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Why leading organizations choose BetterRoad: measurable results that impact your bottom line
            </p>
            <div className="w-20 h-1 bg-blue-600 mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Save Money */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group border border-blue-100">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="/images/benefit2.png"
                  alt="Worker marking road"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800';
                  }}
                />
                <div className="absolute inset-0 bg-blue-900/60"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-blue-600 mb-3">Cut Costs by 40%</h3>
                <p className="text-gray-700 leading-relaxed">
                  Stop wasting budget on unnecessary repairs. Our AI identifies exactly what needs attention, when. Reduce maintenance costs dramatically while extending road lifespan through data-driven decision making.
                </p>
              </div>
            </div>

            {/* Save Time */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group border border-blue-100">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="/images/benefit3.png"
                  alt="Person using mobile app"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800';
                  }}
                />
                <div className="absolute inset-0 bg-blue-900/60"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-blue-600 mb-3">Reclaim 20+ Hours Weekly</h3>
                <p className="text-gray-700 leading-relaxed">
                  Eliminate manual inspections and paperwork forever. Automated data collection means your team spends zero time on tedious documentation. Focus on what matters: fixing roads, not filling forms.
                </p>
              </div>
            </div>

            {/* Get Objective Data */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group border border-blue-100">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="/images/benefit4.png"
                  alt="Dashboard with data"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800';
                  }}
                />
                <div className="absolute inset-0 bg-blue-900/60"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-blue-600 mb-3">Win Every Argument with Data</h3>
                <p className="text-gray-700 leading-relaxed">
                  Present irrefutable evidence in budget meetings. AI-generated reports with precise damage locations, severity metrics, and repair cost estimates. Make decisions confidently backed by objective, verifiable data.
                </p>
              </div>
            </div>

            {/* System Overview */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group border border-blue-100">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="/images/benefit5.png"
                  alt="Computer with dashboard"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800';
                  }}
                />
                <div className="absolute inset-0 bg-blue-900/60"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-blue-600 mb-3">Complete Network Visibility</h3>
                <p className="text-gray-700 leading-relaxed">
                  Monitor your entire road network from one dashboard. Track team performance, repair progress, and budget allocation in real-time. Make strategic decisions with full visibility into every aspect of operations.
                </p>
              </div>
            </div>

            {/* Transparency */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group border border-blue-100">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="/images/benefit6.png"
                  alt="Mobile device with GPS"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800';
                  }}
                />
                <div className="absolute inset-0 bg-blue-900/60"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-blue-600 mb-3">Legal Protection Built-In</h3>
                <p className="text-gray-700 leading-relaxed">
                  Every inspection is automatically documented with timestamps, GPS coordinates, and photo evidence. Create audit trails that protect your organization from liability claims. Sleep well knowing you're fully covered.
                </p>
              </div>
            </div>

            {/* Collaboration */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group border border-blue-100">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="/images/benefit1.png"
                  alt="Team collaboration"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800';
                  }}
                />
                <div className="absolute inset-0 bg-blue-900/60"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-blue-600 mb-3">Unified Team Coordination</h3>
                <p className="text-gray-700 leading-relaxed">
                  Break down silos between departments. Share real-time data across engineering, maintenance, and management teams. Everyone works from the same source of truth, eliminating confusion and accelerating response times.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 px-6 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4">
              Real Results in Just 4 Weeks
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              See measurable improvements from week one. Our clients report 40% cost reduction, 20+ hours saved weekly, and 95% faster damage detection within the first month.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl relative border border-blue-100">
              <div className="absolute -top-4 left-8 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold mt-4 mb-3 text-blue-600">Week 1: Instant Deployment</h3>
              <p className="text-sm text-gray-500 mb-4">Results: System operational, team trained</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Kickoff meeting: Get your team aligned in 60 minutes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Hardware setup: Start collecting data same day</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Training portal: Your team learns in 30 minutes</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl relative border border-blue-100">
              <div className="absolute -top-4 left-8 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                2-3
              </div>
              <h3 className="text-xl font-bold mt-4 mb-3 text-blue-600">Weeks 2-3: First Insights</h3>
              <p className="text-sm text-gray-500 mb-4">Results: Complete road network mapped, damage prioritized</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Initial assessment: See your entire network's condition</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Data analysis: AI identifies critical repairs needed</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>System walkthrough: Optimize workflows for your team</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl relative border border-blue-100">
              <div className="absolute -top-4 left-8 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                4
              </div>
              <h3 className="text-xl font-bold mt-4 mb-3 text-blue-600">Week 4: Measurable Impact</h3>
              <p className="text-sm text-gray-500 mb-4">Results: 40% cost savings, 20+ hours saved weekly</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Results review: See your ROI with detailed analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Goal setting: Plan next quarter with data-driven insights</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Ongoing support: Continuous optimization webinars</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            What Our Customers Say
          </h2>
          <p className="text-center text-blue-200 mb-16 text-lg">
            Real results from real organizations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="/images/customer1.jpg"
                  alt="Customer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop';
                  }}
                />
                <div>
                  <div className="font-bold text-lg">Nguyễn Văn A</div>
                  <div className="text-blue-200 text-sm">Giám đốc Công trình</div>
                  <div className="text-blue-300 text-xs">TP. Hồ Chí Minh</div>
                </div>
              </div>
              <p className="text-lg italic mb-4 text-blue-50">
                "BetterRoad saves us 20 hours a week. The team can now focus on repairs instead of paperwork. Our efficiency has increased dramatically."
              </p>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="/images/customer2.jpg"
                  alt="Customer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop';
                  }}
                />
                <div>
                  <div className="font-bold text-lg">Trần Thị B</div>
                  <div className="text-blue-200 text-sm">Trưởng phòng Kỹ thuật</div>
                  <div className="text-blue-300 text-xs">Hà Nội</div>
                </div>
              </div>
              <p className="text-lg italic mb-4 text-blue-50">
                "The system is incredibly easy to use. Just open the app and drive—the AI automatically detects potholes. No complicated training required. Our team adopted it instantly."
              </p>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="/images/customer3.jpg"
                  alt="Customer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop';
                  }}
                />
                <div>
                  <div className="font-bold text-lg">Lê Văn C</div>
                  <div className="text-blue-200 text-sm">Chủ tịch UBND</div>
                  <div className="text-blue-300 text-xs">Đà Nẵng</div>
                </div>
              </div>
              <p className="text-lg italic mb-4 text-blue-50">
                "Thanks to BetterRoad, we detected and treated damage early, avoiding major repair costs later. The ROI was visible within the first month."
              </p>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 px-6 bg-blue-900 text-white relative overflow-hidden">

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Road Management?
          </h2>
          <p className="text-xl text-blue-100 mb-4 max-w-2xl mx-auto">
            Join 1000+ organizations that have cut costs by 40%, saved 20+ hours weekly, and made data-driven decisions with confidence.
          </p>
          <p className="text-lg text-blue-200 mb-8 max-w-xl mx-auto">
            Start your free trial today. No credit card required. See results in your first week.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/register')}
              className="bg-blue-600 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105 shadow-xl flex items-center gap-2"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-white/10 backdrop-blur-md text-white px-12 py-4 rounded-lg text-lg font-semibold border-2 border-white/30 hover:bg-white/20 transition"
            >
              Already have an account? Sign in
            </button>
          </div>
          <p className="text-sm text-blue-300 mt-6">
            ✓ Free 30-day trial  ✓ No credit card required  ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="mb-4">© 2024 BetterRoad, Inc. All rights reserved.</p>
          <div className="flex justify-center gap-8">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;