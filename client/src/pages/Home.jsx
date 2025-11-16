import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera, BarChart3, Users, Shield, Clock, DollarSign, Target, Eye, FileText } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

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
            <li><a href="#benefits" className="text-gray-700 hover:text-blue-600 transition">Benefit</a></li>
            <li><a href="#process" className="text-gray-700 hover:text-blue-600 transition">Procedure</a></li>
            <li><a href="#contact" className="text-gray-700 hover:text-blue-600 transition">Contact</a></li>
          </ul>
          <button 
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Road<br />Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
           Smart Road Management with AI - Fast, Efficient Damage Detection and Repair
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105"
            >
             Get started for free
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Login
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">Project has been implemented</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-gray-600">Km of monitored road</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-600">AI Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Outstanding features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced AI technology combined with friendly interface
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-8 rounded-2xl text-white transform hover:scale-105 transition">
              <Camera className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Automatic collection</h3>
              <p className="text-purple-100">
                Take photos and record GPS coordinates automatically every 10 feet while moving on the road
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-8 rounded-2xl text-white transform hover:scale-105 transition">
              <BarChart3 className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-3">AI Analytics</h3>
              <p className="text-pink-100">
                AI identifies 5 types of road surface damage with high accuracy, classifying severity
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-8 rounded-2xl text-white transform hover:scale-105 transition">
              <MapPin className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Real-time map</h3>
              <p className="text-blue-100">
                Display all damages on a map, track repair progress in real time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section with Images */}
      <section id="benefits" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Secret Sauce
            </h2>
            <div className="w-20 h-1 bg-yellow-400 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Save Money */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="/images/benefit2.png" 
                  alt="Worker marking road"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Save Money</h3>
                <p className="text-gray-600">
                  We make the most of your budget so you can have a larger impact on your community, for less.
                </p>
              </div>
            </div>

            {/* Save Time */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="/images/benefit3.png"  
                  alt="Person using mobile app"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Save Time</h3>
                <p className="text-gray-600">
                  We save you time by automizing tedious tasks and reducing the amount of trips needed in the field.
                </p>
              </div>
            </div>

            {/* Get Objective Data */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="/images/benefit4.png" 
                  alt="Dashboard with data"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Get Objective Data</h3>
                <p className="text-gray-600">
                  We help you stand your ground in town meetings, armed with objective data that makes decisions easier.
                </p>
              </div>
            </div>

            {/* System Overview */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="/images/benefit5.png"
                  alt="Computer with dashboard"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">See the Big Picture</h3>
                <p className="text-gray-600">
                  We help you stay on top of your team's daily operations and manage their workloads.
                </p>
              </div>
            </div>

            {/* Transparency */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="/images/benefit6.png" 
                  alt="Mobile device with GPS"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Cover Your Behind</h3>
                <p className="text-gray-600">
                  We take care of the legal documentation, so you can rest easy knowing you're protected.
                </p>
              </div>
            </div>

            {/* Collaboration */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="/images/benefit1.png" 
                  alt="Team collaboration"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Collaborate Effectively</h3>
                <p className="text-gray-600">
                  We strengthen collaboration between departments by increasing clarity and streamlining processes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Real Results in Just 4 Weeks
            </h2>
            <p className="text-xl text-gray-600">
              No complex setup. See the impact from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg relative">
              <div className="absolute -top-4 left-8 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mt-4 mb-3">System Launch & Test Drive</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Kickoff Meeting
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Hardware Handover & User Login
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Access to Training Portal
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg relative">
              <div className="absolute -top-4 left-8 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                2,3
              </div>
              <h3 className="text-xl font-bold mt-4 mb-3">First Look at Road Conditions</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Initial Road Condition Assessment
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Data Upload & Functionality Test
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                   System Walkthrough
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg relative">
              <div className="absolute -top-4 left-8 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold mt-4 mb-3">Data Review & Next Steps</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Review the Results
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                   Set Your Goals
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Ongoing Training Webinars
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            What our customers say about us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
              <p className="text-lg italic mb-4">
                "BetterRoad saves us 20 hours a week. The team can now focus on repairs instead of paperwork."
              </p>
              <div className="font-bold">— Giám đốc Công trình, TP.HCM</div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
              <p className="text-lg italic mb-4">
                "The system is very easy to use. Just open the app and drive, the AI ​​automatically detects potholes. No complicated training required."
              </p>
              <div className="font-bold">— Trưởng phòng Kỹ thuật, Hà Nội</div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
              <p className="text-lg italic mb-4">
                "Thanks to BetterRoad, we detected and treated damage early, avoiding major repair costs later."
              </p>
              <div className="font-bold">— Chủ tịch UBND, Đà Nẵng</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to transform road management?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 100+ organizations nationwide that trust BetterRoad
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="bg-blue-600 text-white px-12 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105"
          >
           Sign up for free
          </button>
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