'use client';

import { useState, useEffect } from 'react';
import { Registration } from '@/lib/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchRegistrations();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        fetchRegistrations();
      } else {
        alert(data.error || 'Invalid password');
      }
    } catch (error) {
      alert('Error logging in. Please try again.');
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/admin/registrations?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch registrations');
      }

      setRegistrations(result.data || []);
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
      alert('Error fetching registrations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;

    // Optimistically remove from UI
    const previousRegistrations = registrations;
    setRegistrations(prev => prev.filter(reg => reg.id !== id));
    
    // Close modal if this registration was selected
    if (selectedRegistration?.id === id) {
      setSelectedRegistration(null);
    }

    try {
      const response = await fetch(`/api/admin/registrations/${id}`, {
        method: 'DELETE',
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok) {
        // Restore previous state on error
        setRegistrations(previousRegistrations);
        throw new Error(result.error || 'Failed to delete registration');
      }

      // Refresh from server to ensure consistency
      await fetchRegistrations();
    } catch (error: any) {
      // Restore previous state on error
      setRegistrations(previousRegistrations);
      alert('Error deleting registration: ' + error.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long!' });
      return;
    }

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordMessage(null);
        }, 2000);
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Error changing password. Please try again.' });
    }
  };

  const handleDownloadCSV = () => {
    if (registrations.length === 0) {
      alert('No registrations to download.');
      return;
    }

    // Define CSV headers
    const headers = [
      'Full Name',
      'Kit Number',
      'Email',
      'WhatsApp Number',
      'Car Number Plate',
      'House',
      'Profession',
      'Postal Address',
      'Attending Gala',
      'Morale',
      'Excited for Gala',
      'Photo URL',
      'Registered On'
    ];

    // Convert registrations to CSV rows
    const csvRows = registrations.map(reg => {
      const row = [
        `"${(reg.full_name || '').replace(/"/g, '""')}"`,
        `"${(reg.kit_number || '').replace(/"/g, '""')}"`,
        `"${(reg.email || '').replace(/"/g, '""')}"`,
        `"${(reg.whatsapp_number || '').replace(/"/g, '""')}"`,
        `"${(reg.car_number_plate || '').replace(/"/g, '""')}"`,
        `"${(reg.house || '').replace(/"/g, '""')}"`,
        `"${(reg.profession || '').replace(/"/g, '""')}"`,
        `"${(reg.postal_address || '').replace(/"/g, '""')}"`,
        `"${(reg.attend_gala || '').replace(/"/g, '""')}"`,
        `"${(reg.morale || '').replace(/"/g, '""')}"`,
        `"${(reg.excited_for_gala || '').replace(/"/g, '""')}"`,
        `"${(reg.photo_url || '').replace(/"/g, '""')}"`,
        `"${reg.created_at ? new Date(reg.created_at).toLocaleString() : ''}"`
      ];
      return row.join(',');
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows
    ].join('\n');

    // Add BOM for UTF-8 (helps Excel open it correctly)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `kohatians-registrations-${date}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistrations = registrations.filter(reg =>
    reg.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.kit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.whatsapp_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.car_number_plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination settings
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset to page 1 when registrations change
  useEffect(() => {
    setCurrentPage(1);
  }, [registrations.length]);

  const totalCount = registrations.length;
  const attendingCount = registrations.filter(r => r.attend_gala === 'Yes').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 via-pink-900 to-indigo-950 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wMyIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
        
        {/* Main login card */}
        <div className="relative z-10 bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full border border-white/10 animate-slide-in">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              {/* Lock icon with glow */}
              <div className="inline-flex items-center justify-center mb-6">
                <div className="absolute w-20 h-20 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 rounded-2xl blur-xl"></div>
                <div className="relative p-5 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl">
                  <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent drop-shadow-2xl">
                Admin Portal
              </h1>
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-indigo-400 to-transparent mx-auto mb-3"></div>
              <p className="text-gray-300 text-sm md:text-base">Enter your password to continue</p>
            </div>
            
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
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </form>
          </div>
        </div>
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 mb-6 border border-gray-700/50">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Admin Portal
              </h1>
              <p className="text-gray-400">Manage registrations and view statistics</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Change Password
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 p-6 rounded-2xl border-2 border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Total Registrations</h3>
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-extrabold text-blue-400">{totalCount}</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-6 rounded-2xl border-2 border-green-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Attending Gala</h3>
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-extrabold text-green-400">{attendingCount}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 p-6 rounded-2xl border-2 border-yellow-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Not Attending</h3>
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-extrabold text-yellow-400">{totalCount - attendingCount}</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, kit number, whatsapp, or car plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
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
              onClick={handleDownloadCSV}
              disabled={registrations.length === 0}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV
            </button>
          </div>
        </div>

        <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-700/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Photo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Kit Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                    WhatsApp Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Car Number Plate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {paginatedRegistrations.map((reg, index) => (
                  <tr key={reg.id} className="hover:bg-gradient-to-r hover:from-indigo-900/30 hover:to-purple-900/30 transition-all duration-200 animate-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reg.photo_url ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur opacity-30"></div>
                          <Image
                            src={reg.photo_url}
                            alt={reg.full_name}
                            width={56}
                            height={56}
                            className="relative rounded-full object-cover border-2 border-gray-600 shadow-lg"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full border-2 border-gray-500"></div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-200">{reg.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                        {reg.kit_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {reg.whatsapp_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {reg.car_number_plate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedRegistration(reg)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-xs font-semibold"
                        >
                          More
                        </button>
                        <button
                          onClick={() => handleDelete(reg.id!)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRegistrations.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block p-4 bg-gray-700 rounded-full mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg font-medium">
                {searchTerm ? 'No registrations found matching your search.' : 'No registrations yet.'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredRegistrations.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-800/50 border-t border-gray-700/50">
              <div className="text-sm text-gray-400">
                Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-white">{Math.min(endIndex, filteredRegistrations.length)}</span> of{' '}
                <span className="font-semibold text-white">{filteredRegistrations.length}</span> entries
                {searchTerm && (
                  <span className="ml-2 text-indigo-400">(filtered from {registrations.length} total)</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-all duration-200 font-semibold ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md flex items-center gap-2"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* More Details Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-slide-in">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Registration Details
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Complete information for this registration</p>
                </div>
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {selectedRegistration.photo_url && (
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-xl opacity-30"></div>
                      <Image
                        src={selectedRegistration.photo_url}
                        alt={selectedRegistration.full_name}
                        width={150}
                        height={150}
                        className="relative rounded-full object-cover border-4 border-gray-600 shadow-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Full Name</label>
                    <p className="text-gray-200 font-semibold">{selectedRegistration.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Kit Number</label>
                    <p className="text-gray-200 font-semibold">{selectedRegistration.kit_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Email</label>
                    <p className="text-gray-300">{selectedRegistration.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">WhatsApp Number</label>
                    <p className="text-gray-300">{selectedRegistration.whatsapp_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Car Number Plate</label>
                    <p className="text-gray-300">{selectedRegistration.car_number_plate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">House</label>
                    <p className="text-gray-300">{selectedRegistration.house}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Profession</label>
                    <p className="text-gray-300">{selectedRegistration.profession}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Attending Gala</label>
                    <p className="text-gray-300">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedRegistration.attend_gala === 'Yes' ? 'bg-green-600/30 text-green-300 border border-green-500/30' : 'bg-red-600/30 text-red-300 border border-red-500/30'
                      }`}>
                        {selectedRegistration.attend_gala}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Morale</label>
                    <p className="text-gray-300">{selectedRegistration.morale}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Excited for Gala</label>
                    <p className="text-gray-300">{selectedRegistration.excited_for_gala}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-400">Postal Address</label>
                    <p className="text-gray-300">{selectedRegistration.postal_address}</p>
                  </div>
                  {selectedRegistration.created_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">Registered On</label>
                      <p className="text-gray-300">
                        {new Date(selectedRegistration.created_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => handleDelete(selectedRegistration.id!)}
                  className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  Delete Registration
                </button>
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-slide-in">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full border border-gray-700/50">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Change Password
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Update your admin password</p>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordMessage(null);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                {passwordMessage && (
                  <div className={`p-4 rounded-xl border-l-4 ${
                    passwordMessage.type === 'success' 
                      ? 'bg-green-900/30 text-green-300 border-green-500' 
                      : 'bg-red-900/30 text-red-300 border-red-500'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}

                <div className="group">
                  <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white backdrop-blur-sm hover:border-gray-500"
                    required
                  />
                </div>

                <div className="group">
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white backdrop-blur-sm hover:border-gray-500"
                    required
                    minLength={6}
                  />
                </div>

                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white backdrop-blur-sm hover:border-gray-500"
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordMessage(null);
                    }}
                    className="bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
