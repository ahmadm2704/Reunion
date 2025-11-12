'use client';

import { useState, useEffect } from 'react';
import { Registration } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function KitStatsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchRegistrations();
    }
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/admin/registrations?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch registrations`);
      }

      const result = await response.json();
      const fetchedData = result.data || [];
      setRegistrations(fetchedData);
    } catch (error: any) {
      console.error('❌ Error fetching registrations:', error);
      setError(error.message || 'Failed to fetch registrations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
        setPassword('');
        await fetchRegistrations();
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (error: any) {
      setError(error.message || 'Error logging in. Please try again.');
    }
  };

  // Calculate statistics by digit count
  const calculateStats = () => {
    const stats: { [key: number]: number } = {};
    
    registrations.forEach(reg => {
      if (reg.kit_number) {
        const digitCount = reg.kit_number.trim().length;
        stats[digitCount] = (stats[digitCount] || 0) + 1;
      }
    });
    
    return stats;
  };

  const stats = calculateStats();
  const sortedDigitCounts = Object.keys(stats)
    .map(Number)
    .sort((a, b) => a - b);
  const totalRegistrations = registrations.length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 via-pink-900 to-indigo-950 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wMyIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
        
        <div className="relative z-10 bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full border border-white/10 animate-slide-in">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="absolute w-20 h-20 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 rounded-2xl blur-xl"></div>
                <div className="relative p-5 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl">
                  <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent drop-shadow-2xl">
                Kit Stats
              </h1>
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-indigo-400 to-transparent mx-auto mb-3"></div>
              <p className="text-gray-300 text-sm md:text-base">Enter your password to continue</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 text-red-300 border border-red-500/30 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-300 transition-colors">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all duration-200 bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 hover:border-white/20"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>Login</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 mb-6 border border-gray-700/50">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Kit Number Statistics
              </h1>
              <p className="text-gray-400">Distribution of kit numbers by digit count</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchRegistrations}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Back to Admin
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem('admin_authenticated');
                  setIsAuthenticated(false);
                  router.push('/');
                }}
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 p-6 rounded-2xl border-2 border-blue-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">Total Registrations</h3>
                <p className="text-4xl font-extrabold text-blue-400">{totalRegistrations}</p>
              </div>
              <div className="p-4 bg-blue-600/20 rounded-lg">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 text-red-300 border-l-4 border-red-500 rounded-lg flex items-start justify-between">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-11a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-700/50">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Distribution by Digit Count</h2>
            
            {loading ? (
              <div className="text-center py-16">
                <svg className="animate-spin h-12 w-12 text-indigo-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-400">Loading statistics...</p>
              </div>
            ) : sortedDigitCounts.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-block p-4 bg-gray-700 rounded-full mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg font-medium">No registrations found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedDigitCounts.map(digitCount => {
                  const count = stats[digitCount];
                  const percentage = totalRegistrations > 0 ? ((count / totalRegistrations) * 100).toFixed(1) : 0;
                  
                  return (
                    <div
                      key={digitCount}
                      className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 p-6 rounded-2xl border-2 border-indigo-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-indigo-600/20 rounded-lg">
                          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          {digitCount} {digitCount === 1 ? 'Digit' : 'Digits'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <p className="text-3xl font-extrabold text-indigo-400">{count}</p>
                        <p className="text-sm text-gray-400 mt-1">{percentage}% of total</p>
                      </div>
                      <div className="mt-4 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Table */}
          {sortedDigitCounts.length > 0 && (
            <div className="border-t border-gray-700/50 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-200 mb-6">Detailed Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Digit Count
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Visual
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {sortedDigitCounts.map(digitCount => {
                      const count = stats[digitCount];
                      const percentage = totalRegistrations > 0 ? ((count / totalRegistrations) * 100).toFixed(1) : 0;
                      
                      return (
                        <tr key={digitCount} className="hover:bg-gradient-to-r hover:from-indigo-900/30 hover:to-purple-900/30 transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                              {digitCount} {digitCount === 1 ? 'Digit' : 'Digits'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-lg font-bold text-gray-200">{count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{percentage}%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full max-w-xs h-3 bg-gray-700/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



