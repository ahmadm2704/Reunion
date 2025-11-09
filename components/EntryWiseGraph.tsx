'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Registration } from '@/lib/supabase';

interface EntryData {
  entry: string;
  count: number;
}

export default function EntryWiseGraph() {
  const [chartData, setChartData] = useState<EntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const colors = [
    '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#1d4ed8',
  ];

  const extractEntry = (kitNumber: string): string => {
    if (!kitNumber) return 'Unknown';
    const numStr = String(kitNumber).trim();
    if (numStr.length <= 3) return numStr.charAt(0);
    return numStr.substring(0, 2);
  };

  // Check screen size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAndProcessData();
  }, []);

  const fetchAndProcessData = async () => {
    try {
      setLoading(true);
      setError(null);

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
        throw new Error('Failed to fetch registrations');
      }

      const result = await response.json();
      const registrations: Registration[] = result.data || [];

      const entryMap = new Map<string, number>();
      registrations.forEach((reg) => {
        const entry = extractEntry(reg.kit_number);
        entryMap.set(entry, (entryMap.get(entry) || 0) + 1);
      });

      const sortedEntries = Array.from(entryMap.entries())
        .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
        .map(([entry, count]) => ({ entry, count }));

      setChartData(sortedEntries);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 sm:h-80 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 sm:h-12 sm:w-12 text-indigo-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-400 text-xs sm:text-sm">Loading registration data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 sm:h-80 flex items-center justify-center px-2">
        <div className="text-center">
          <p className="text-red-400 text-xs sm:text-sm mb-3">{error}</p>
          <button
            onClick={fetchAndProcessData}
            className="px-3 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 sm:h-80 flex items-center justify-center px-2">
        <div className="text-center">
          <p className="text-gray-400 text-xs sm:text-sm">No registration data available</p>
        </div>
      </div>
    );
  }

  const totalRegistrations = chartData.reduce((sum, item) => sum + item.count, 0);
  
  // Responsive settings
  const chartHeight = isMobile ? 300 : isTablet ? 320 : 400;
  
  // Mobile has more bottom margin for rotated labels
  const chartMargins = isMobile 
    ? { top: 10, right: 10, left: 10, bottom: 50 }
    : isTablet 
    ? { top: 10, right: 30, left: 0, bottom: 30 }
    : { top: 10, right: 30, left: 0, bottom: 0 };

  // Text sizes
  const headingClass = isMobile ? 'text-lg sm:text-xl' : 'text-2xl md:text-3xl';
  const subHeadingClass = isMobile ? 'text-xs sm:text-sm' : 'text-sm';
  const buttonClass = isMobile ? 'text-xs px-2 py-1 sm:text-sm sm:px-4 sm:py-2' : 'text-sm px-4 py-2';
  const tableHeadingClass = isMobile ? 'text-xs sm:text-sm' : 'text-sm';
  const tableCellClass = isMobile ? 'py-2 px-2 text-xs sm:py-3 sm:px-4 sm:text-sm' : 'py-3 px-4 text-sm';

  return (
    <div className="w-full space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header - Responsive Stack/Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className={`${headingClass} font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent truncate`}>
            Entry-wise Analytics
          </h2>
          <p className={`${subHeadingClass} text-gray-400 mt-1`}>
            Total: <span className="font-bold text-white">{totalRegistrations}</span>
          </p>
        </div>
        
        <button
          onClick={fetchAndProcessData}
          className={`${buttonClass} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 w-full sm:w-fit flex-shrink-0`}
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Bar Chart Container - Responsive */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg sm:rounded-2xl p-3 sm:p-6 border border-gray-700/50 shadow-xl overflow-hidden">
        <h3 className={`${tableHeadingClass} font-semibold text-white mb-3 sm:mb-4`}>Bar Chart View</h3>
        
        {/* Scrollable container for mobile */}
        <div className="w-full overflow-x-auto">
          <div style={{ minWidth: isMobile ? `${Math.max(300, chartData.length * 50)}px` : '100%', minHeight: `${chartHeight}px` }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart 
                data={chartData}
                margin={chartMargins}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#404854" />
                <XAxis 
                  dataKey="entry" 
                  stroke="#9ca3af" 
                  style={{ fontSize: isMobile ? '9px' : '12px', fontWeight: 'bold' }}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? 'end' : 'middle'}
                  height={isMobile ? 70 : 30}
                  tick={{ fontSize: isMobile ? 9 : 12 }}
                  interval={0}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  style={{ fontSize: isMobile ? '9px' : '12px' }}
                  tick={{ fontSize: isMobile ? 9 : 12 }}
                  width={isMobile ? 30 : 50}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151', 
                    borderRadius: '8px', 
                    color: '#e5e7eb',
                    fontSize: isMobile ? '11px' : '12px',
                    padding: isMobile ? '6px 8px' : '8px 12px'
                  }} 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '12px',
                    fontSize: isMobile ? '10px' : '12px'
                  }} 
                  iconType="square"
                />
                <Bar dataKey="count" fill="#6366f1" name="Registrations" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Statistics Table - Responsive */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg sm:rounded-2xl p-3 sm:p-6 border border-gray-700/50 shadow-xl overflow-x-auto">
        <h3 className={`${tableHeadingClass} font-bold text-white mb-3 sm:mb-4`}>Entry-wise Breakdown</h3>
        
        {/* Mobile Card View */}
        {isMobile ? (
          <div className="space-y-2">
            {chartData.map((item, index) => {
              const percentage = ((item.count / totalRegistrations) * 100).toFixed(1);
              return (
                <div 
                  key={item.entry} 
                  className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/50 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      >
                        {item.entry}
                      </span>
                      <span className="text-xs text-gray-300 font-semibold">Entry {item.entry}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-200">{item.count}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress:</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: colors[index % colors.length]
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Desktop Table View
          <div className="overflow-x-auto">
            <table className="w-full min-w-max sm:min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className={`${tableCellClass} text-left text-gray-300 font-semibold`}>Entry</th>
                  <th className={`${tableCellClass} text-left text-gray-300 font-semibold`}>Registrations</th>
                  <th className={`${tableCellClass} text-left text-gray-300 font-semibold`}>Percentage</th>
                  <th className={`${tableCellClass} text-left text-gray-300 font-semibold`}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => {
                  const percentage = ((item.count / totalRegistrations) * 100).toFixed(1);
                  return (
                    <tr 
                      key={item.entry} 
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className={`${tableCellClass} font-semibold text-white`}>
                        <span 
                          className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white text-xs sm:text-sm font-bold"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        >
                          {item.entry}
                        </span>
                      </td>
                      <td className={`${tableCellClass} text-gray-300 font-semibold`}>{item.count}</td>
                      <td className={`${tableCellClass} text-gray-300`}>{percentage}%</td>
                      <td className={`${tableCellClass}`}>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: colors[index % colors.length]
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend - Responsive Grid */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg sm:rounded-2xl p-3 sm:p-6 border border-gray-700/50 shadow-xl">
        <h3 className={`${tableHeadingClass} font-bold text-white mb-3 sm:mb-4`}>Entry Legend</h3>
        <div className={`grid gap-2 sm:gap-3 ${isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3 lg:grid-cols-4' : 'grid-cols-3 lg:grid-cols-5'}`}>
          {chartData.map((item, index) => (
            <div 
              key={item.entry} 
              className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              <div 
                className="w-3 h-3 sm:w-4 sm:h-4 rounded flex-shrink-0"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span className="text-xs sm:text-sm text-gray-300 truncate">
                <span className="font-bold">E{item.entry}</span>: {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box - Responsive */}
      <div className="bg-indigo-900/30 backdrop-blur-xl rounded-lg sm:rounded-2xl p-3 sm:p-4 border border-indigo-500/30 text-center">
        <p className="text-xs sm:text-sm text-indigo-300">
          📊 Data updates automatically. Click <span className="font-bold">Refresh</span> for latest registrations.
        </p>
      </div>
    </div>
  );
}