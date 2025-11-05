'use client';

import Image from 'next/image';
import RegistrationForm from '@/components/RegistrationForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
      {/* Hero Section */}
      <section className="relative w-full h-[75vh] min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://static.where-e.com/Pakistan/Khyber_Pakhtunkhwa/Kohat/Cadet-College-Kohat_4c006364fa7ffc564e9675e322938bbf.jpg"
            alt="Cadet College Kohat"
            fill
            className="object-cover scale-105 transition-transform duration-700 opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-indigo-900/90 to-purple-900/95"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="mb-6 md:mb-8 animate-float">
            <div className="relative mx-auto w-fit">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl opacity-50"></div>
              <div className="relative">
                <Image
                  src="https://cck.edu.pk/sites/default/files/images/cck-logo-sm.png"
                  alt="CCK Logo"
                  width={120}
                  height={120}
                  className="mx-auto bg-white/10 backdrop-blur-md rounded-full p-3 md:p-4 shadow-2xl border-2 border-indigo-400/30 max-w-[120px] max-h-[120px]"
                />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 drop-shadow-2xl animate-slide-in px-4">
            <span className="bg-gradient-to-r from-yellow-300 via-white to-yellow-300 bg-clip-text text-transparent">
              Kohatians Reunion
            </span>
          </h1>
          
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mb-4"></div>
          
          <p className="text-xl sm:text-2xl md:text-3xl text-white/95 mb-3 drop-shadow-xl font-semibold animate-slide-in px-4" style={{ animationDelay: '0.1s' }}>
            Gathering (GTG) 2025
          </p>
          
          <p className="text-lg sm:text-xl md:text-2xl text-yellow-300 font-bold drop-shadow-lg italic mb-6 md:mb-8 animate-slide-in px-4" style={{ animationDelay: '0.2s' }}>
            Once a Kohatian, Always a Kohatian
          </p>
          
          <div className="mt-6 md:mt-8 glass-dark rounded-2xl p-6 md:p-8 max-w-3xl border border-white/10 shadow-2xl animate-slide-in mx-4" style={{ animationDelay: '0.3s' }}>
            <p className="text-white/90 text-base sm:text-lg md:text-xl leading-relaxed">
              Dear Kohatians, We invite you to register for the upcoming Gathering (GTG) scheduled for the evening of{' '}
              <span className="font-bold text-yellow-300">November 22, 2025</span>, at{' '}
              <span className="font-bold text-yellow-300">Sareena, Islamabad</span>. If you plan to attend, kindly register to help us make the necessary arrangements. We look forward to seeing you for an evening of socializing, dinner, music, and merriment.
            </p>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12 animate-slide-in">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Registration Form
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-indigo-400 to-pink-400 mx-auto rounded-full"></div>
          </div>
          
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-700/50 hover:shadow-purple-500/20 transition-all duration-300">
            <RegistrationForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white py-12 text-center relative overflow-hidden border-t border-gray-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wMyIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
        <div className="relative z-10">
          <p className="text-xl font-semibold mb-2">© 2025 Kohatians Reunion. All rights reserved.</p>
          <p className="text-base text-gray-400 mb-4 italic">Once a Kohatian, Always a Kohatian</p>
          <a 
            href="/admin" 
            className="inline-block px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Admin Portal
          </a>
        </div>
      </footer>
    </div>
  );
}

