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
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-400">Loading registration data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchAndProcessData}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">No registration data available</p>
        </div>
      </div>
    );
  }

  const totalRegistrations = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Entry-wise Registration Analytics
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Total Registrations: <span className="font-bold text-white">{totalRegistrations}</span>
          </p>
        </div>
        
        <button
          onClick={fetchAndProcessData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Bar Chart */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Bar Chart View</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#404854" />
            <XAxis dataKey="entry" stroke="#9ca3af" style={{ fontSize: '12px', fontWeight: 'bold' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }} 
              cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
            <Bar dataKey="count" fill="#6366f1" name="Registrations" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics Table */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl overflow-x-auto">
        <h3 className="text-lg font-bold text-white mb-4">Entry-wise Breakdown</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Entry</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Registrations</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Percentage</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Progress</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item, index) => {
              const percentage = ((item.count / totalRegistrations) * 100).toFixed(1);
              return (
                <tr key={item.entry} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    <span 
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    >
                      {item.entry}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-semibold">{item.count}</td>
                  <td className="py-3 px-4 text-gray-300">{percentage}%</td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
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

      {/* Legend */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Entry Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {chartData.map((item, index) => (
            <div key={item.entry} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span className="text-sm text-gray-300">
                Entry <span className="font-bold">{item.entry}</span>: {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}