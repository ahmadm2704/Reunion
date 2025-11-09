'use client';

import { useState } from 'react';
import Image from 'next/image';
import RegistrationForm from '@/components/RegistrationForm';
import EntryWiseGraph from '@/components/EntryWiseGraph';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'form' | 'analytics'>('form');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 -z-20">
          <Image
            src="https://static.where-e.com/Pakistan/Khyber_Pakhtunkhwa/Kohat/Cadet-College-Kohat_4c006364fa7ffc564e9675e322938bbf.jpg"
            alt="Cadet College Kohat"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-indigo-900/75 to-purple-900/80 -z-10"></div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-10 -z-10"></div>
        
        {/* Content Container */}
        <div className="relative z-10 py-20 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          {/* Logo Section */}
          <div className="mb-8 animate-float">
            <div className="relative mx-auto w-fit">
              <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-3xl opacity-60 animate-pulse"></div>
              <div className="relative bg-white rounded-full p-4 shadow-2xl border-4 border-yellow-400/50">
                <Image
                  src="https://cck.edu.pk/sites/default/files/images/cck-logo-sm.png"
                  alt="CCK Logo"
                  width={120}
                  height={120}
                  className="w-28 h-28 md:w-32 md:h-32 object-contain"
                  priority
                />
              </div>
            </div>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 drop-shadow-2xl px-4 leading-tight">
            <span className="bg-gradient-to-r from-yellow-300 via-white to-yellow-300 bg-clip-text text-transparent">
              Kohatians Reunion
            </span>
          </h1>
          
          {/* Decorative Line */}
          <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mb-8 rounded-full"></div>
          
          {/* Subtitle */}
          <p className="text-2xl sm:text-3xl md:text-4xl text-white/95 mb-4 drop-shadow-xl font-semibold px-4">
            Gathering (GTG) 2025
          </p>
          
          {/* Tagline */}
          <p className="text-xl sm:text-2xl md:text-3xl text-yellow-300 font-bold drop-shadow-lg italic mb-10 px-4">
            Once a Kohatian, Always a Kohatian
          </p>
          
          {/* Main Info Box */}
          <div className="glass-dark rounded-3xl p-8 md:p-10 max-w-3xl border border-white/10 shadow-2xl mb-10 backdrop-blur-md bg-white/5">
            <p className="text-white/90 text-base sm:text-lg md:text-xl leading-relaxed">
              Dear Kohatians, we invite you to register for the upcoming <span className="font-bold text-yellow-300">Gathering (GTG)</span> scheduled for the evening of{' '}
              <span className="font-bold text-yellow-300 text-lg">November 22, 2025</span>, at{' '}
              <span className="font-bold text-yellow-300 text-lg">SERENA, Islamabad</span>. If you plan to attend, kindly register to help us make the necessary arrangements. We look forward to seeing you for an evening of socializing, dinner, music, and merriment.
            </p>
          </div>

          {/* Important Notice - REGISTRATION IS MANDATORY */}
          <div className="max-w-3xl mx-4 w-full mb-8">
            <div className="bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-red-500/30 backdrop-blur-md rounded-3xl p-8 md:p-10 border-4 border-yellow-400/70 shadow-2xl ring-2 ring-yellow-400/30">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="flex items-center justify-center gap-4 w-full">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-yellow-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-yellow-300 font-extrabold text-lg sm:text-xl md:text-2xl leading-tight drop-shadow-2xl">
                    REGISTRATION IS MANDATORY
                  </p>
                </div>

                <p className="text-white/95 font-semibold text-base md:text-lg">
                  Open for all Kohatians
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action Button */}
          <div className="mb-8">
            <a 
              href="#content"
              className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 font-bold text-lg rounded-xl hover:from-yellow-300 hover:to-yellow-200 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              ↓ Start Here ↓
            </a>
          </div>
        </div>
      </section>

      {/* Navigation Tabs Section */}
      <section id="content" className="py-12 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50 -z-10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Tab Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 justify-center">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 shadow-lg transform hover:scale-105 ${
                activeTab === 'form'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-indigo-500/50'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Registration Form
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 shadow-lg transform hover:scale-105 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-indigo-500/50'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </span>
            </button>
          </div>

          {/* Content Area */}
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-12 border border-gray-700/50 hover:shadow-purple-500/20 transition-all duration-300">
            {/* Registration Form Tab */}
            {activeTab === 'form' && (
              <div className="animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Registration Form
                  </h2>
                  <div className="h-1.5 w-32 bg-gradient-to-r from-indigo-400 to-pink-400 mx-auto rounded-full"></div>
                  <p className="text-gray-400 mt-4 text-sm sm:text-base">Fill in your details below to register for the event</p>
                </div>
                <RegistrationForm />
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Live Registration Analytics
                  </h2>
                  <div className="h-1.5 w-32 bg-gradient-to-r from-indigo-400 to-pink-400 mx-auto rounded-full"></div>
                  <p className="text-gray-400 mt-4 text-sm sm:text-base">Track registrations by entry in real-time</p>
                </div>
                <EntryWiseGraph />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Details Section - MOVED DOWN */}
      <section className="py-12 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50 -z-10"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl sm:rounded-3xl p-8 md:p-10 border-2 border-indigo-400/50 shadow-2xl">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Need Help with Registration?
              </h2>
              <p className="text-gray-300 mb-6 text-sm sm:text-base">
                Have questions or need assistance? Contact us anytime!
              </p>

              {/* Contact Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center items-center">
                <a 
                  href="tel:+923489884757" 
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-xl text-white font-bold text-sm md:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-indigo-400/50 hover:border-indigo-300"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+92 348 9884757</span>
                </a>
                <a 
                  href="tel:+923085551409" 
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl text-white font-bold text-sm md:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-purple-400/50 hover:border-purple-300"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+92 308 5551409</span>
                </a>
                <a 
                  href="tel:+923332480909" 
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 rounded-xl text-white font-bold text-sm md:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-pink-400/50 hover:border-pink-300"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+92 333 2480909</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white py-12 text-center relative overflow-hidden border-t border-gray-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wMyIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
        <div className="relative z-10">
          <p className="text-xl font-semibold mb-2">© 2025 Kohatians Reunion. All rights reserved.</p>
          <p className="text-base text-gray-400 mb-6 italic">Once a Kohatian, Always a Kohatian</p>
        </div>
      </footer>

      {/* Fade in animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}