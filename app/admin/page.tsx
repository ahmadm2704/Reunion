'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Registration>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyticsView, setAnalyticsView] = useState<'entry' | 'digit'>('entry');
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousCountRef = useRef<number>(0);
  const router = useRouter();

  // Enhanced fetchRegistrations with better error handling
  const fetchRegistrations = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
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

      // Sort by creation date (newest first)
      const sortedData = fetchedData.sort((a: Registration, b: Registration) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      setRegistrations(sortedData);
      setLastRefreshTime(new Date());
      previousCountRef.current = sortedData.length;

      console.log(`✅ Successfully fetched ${sortedData.length} registrations`);
      
      if (sortedData.length === 0) {
        console.warn('⚠️ No registrations found - database may be empty');
      }
    } catch (error: any) {
      console.error('❌ Error fetching registrations:', error);
      setError(error.message || 'Failed to fetch registrations. Please try again.');
      
      if (registrations.length === 0) {
        setRegistrations([]);
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [registrations.length]);

  // Fetch registration status
  const fetchRegistrationStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/registration-status');
      if (response.ok) {
        const data = await response.json();
        setIsRegistrationOpen(data.isOpen !== false);
      }
    } catch (error) {
      console.error('Error fetching registration status:', error);
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchRegistrations(false);
      fetchRegistrationStatus();
    }
  }, [fetchRegistrations, fetchRegistrationStatus]);

  // Toggle registration status
  const toggleRegistrationStatus = async () => {
    setIsTogglingStatus(true);
    try {
      const newStatus = !isRegistrationOpen;
      const response = await fetch('/api/admin/registration-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOpen: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsRegistrationOpen(data.isOpen);
        setMessage({ type: 'success', text: data.message || `Registration ${newStatus ? 'opened' : 'closed'} successfully` });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to update registration status' });
      }
    } catch (error: any) {
      console.error('Error toggling registration status:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update registration status' });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Real-time polling with smart refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      fetchRegistrations(false);
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isAuthenticated, fetchRegistrations]);

  // Handle visibility change (tab switch)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 Tab is now visible - fetching latest data');
        fetchRegistrations(false);
      }
    };

    const handleFocus = () => {
      console.log('🔄 Window focused - fetching latest data');
      fetchRegistrations(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, fetchRegistrations]);

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
        await fetchRegistrations(false);
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (error: any) {
      setError(error.message || 'Error logging in. Please try again.');
    }
  };

  // Edit Handler
  const handleEditClick = (registration: Registration) => {
    setEditData({ ...registration });
    setIsEditMode(true);
    setEditMessage(null);
  };

  const handleEditChange = (field: string, value: any) => {
    // For kit_number, only allow numeric input
    if (field === 'kit_number') {
      const numericValue = String(value).replace(/\D/g, '');
      setEditData(prev => ({
        ...prev,
        [field]: numericValue
      }));
      return;
    }
    
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    if (!selectedRegistration?.id) return;

    setEditLoading(true);
    setEditMessage(null);

    try {
      // Validate kit number is numeric only if it's being updated
      if (editData.kit_number !== undefined) {
        const kitNumber = String(editData.kit_number).trim();
        if (!kitNumber || !/^\d+$/.test(kitNumber)) {
          setEditMessage({ 
            type: 'error', 
            text: 'Kit number must contain only numbers (0-9)' 
          });
          setEditLoading(false);
          return;
        }
      }

      const response = await fetch(`/api/admin/registrations/${selectedRegistration.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify(editData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update registration');
      }

      setEditMessage({ type: 'success', text: 'Registration updated successfully!' });
      
      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.id === selectedRegistration.id 
          ? { ...reg, ...editData }
          : reg
      ));

      setSelectedRegistration(prev => 
        prev ? { ...prev, ...editData } : null
      );

      setTimeout(() => {
        setIsEditMode(false);
        setEditMessage(null);
      }, 2000);

      await fetchRegistrations(false);
    } catch (error: any) {
      console.error('❌ Error updating registration:', error);
      setEditMessage({ type: 'error', text: error.message || 'Failed to update registration' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditData({});
    setEditMessage(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the registration for ${name}?`)) return;

    const previousRegistrations = registrations;
    setRegistrations(prev => prev.filter(reg => reg.id !== id));
    
    if (selectedRegistration?.id === id) {
      setSelectedRegistration(null);
    }

    try {
      const response = await fetch(`/api/admin/registrations/${id}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok) {
        setRegistrations(previousRegistrations);
        setError(result.error || 'Failed to delete registration');
        throw new Error(result.error || 'Failed to delete registration');
      }

      console.log(`✅ Successfully deleted registration ${id}`);
      await fetchRegistrations(false);
    } catch (error: any) {
      setRegistrations(previousRegistrations);
      setError(error.message || 'Error deleting registration');
      console.error('❌ Error deleting registration:', error);
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

    const csvContent = [
      headers.join(','),
      ...csvRows
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `kohatians-registrations-${date}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const fullName = (reg.full_name || '').toLowerCase();
    const kitNumber = (reg.kit_number || '').toLowerCase();
    
    // Kit number must start with search term, name can contain it
    return fullName.includes(searchLower) || kitNumber.startsWith(searchLower);
  });

  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalCount = registrations.length;
  const attendingCount = registrations.filter(r => r.attend_gala === 'Yes').length;

  // Extract entry number from kit number based on specific rules
  const getEntryNumber = (kitNumber: string): number | null => {
    if (!kitNumber) return null;
    
    const trimmed = kitNumber.trim();
    if (trimmed.length === 0) return null;
    
    const digitCount = trimmed.length;
    const kitNum = parseInt(trimmed);
    
    // Skip if not a valid number
    if (isNaN(kitNum)) return null;
    
    // Entry 1: 1-digit numbers (1-9) and 2-digit numbers (10-80)
    if (digitCount === 1) {
      if (kitNum >= 1 && kitNum <= 9) return 1;
    }
    if (digitCount === 2) {
      if (kitNum >= 10 && kitNum <= 80) return 1;
      return null; // Other 2-digit numbers don't match any entry
    }
    
    // For 3-digit numbers
    if (digitCount === 3) {
      const firstTwoDigits = parseInt(trimmed.substring(0, 2));
      const firstDigit = parseInt(trimmed[0]);
      
      // Check 86 and 87 first (before single digit checks) - these go to entries 22 and 23
      if (firstTwoDigits === 86) return 22;
      if (firstTwoDigits === 87) return 23;
      
      // Then check single digit patterns for 3-digit numbers
      // Entry 2: 3-digit numbers starting with 1 → displayed as "2" on x-axis
      if (firstDigit === 1) return 2;
      // Entry 3: 3-digit numbers starting with 2 → displayed as "3" on x-axis
      if (firstDigit === 2) return 3;
      // Entry 4: 3-digit numbers starting with 3 → displayed as "4" on x-axis
      if (firstDigit === 3) return 4;
      // Entry 5: 3-digit numbers starting with 4 → displayed as "5" on x-axis
      if (firstDigit === 4) return 5;
      // Entry 6: 3-digit numbers starting with 5 OR 6 → displayed as "6" on x-axis
      // Examples: 500, 501, 600, 601 all go to Entry 6
      if (firstDigit === 5) return 6;
      if (firstDigit === 6) return 6;
      // Entry 7: 3-digit numbers starting with 7
      if (firstDigit === 7) return 7;
      // Entry 8: 3-digit numbers starting with 8 (86 and 87 already handled above)
      if (firstDigit === 8) return 8;
      // Entry 9: 3-digit numbers starting with 9
      if (firstDigit === 9) return 9;
    }
    
    // For 4-digit and 5-digit numbers starting from 10 to 56
    // The first 2 digits represent the entry number
    if (digitCount === 4 || digitCount === 5) {
      const firstTwoDigits = parseInt(trimmed.substring(0, 2));
      if (!isNaN(firstTwoDigits) && firstTwoDigits >= 10 && firstTwoDigits <= 56) {
        return firstTwoDigits;
      }
    }
    
    // For other cases, return null to keep them grouped separately
    return null;
  };

  // Calculate statistics by entry number
  const calculateStats = () => {
    const stats: { [key: number]: number } = {};
    const otherStats: { [key: string]: number } = {}; // For entries that don't match rules
    
    registrations.forEach(reg => {
      if (reg.kit_number) {
        const entryNumber = getEntryNumber(reg.kit_number);
        
        if (entryNumber !== null) {
          stats[entryNumber] = (stats[entryNumber] || 0) + 1;
        } else {
          // Keep other entries grouped by digit count
          const digitCount = reg.kit_number.trim().length;
          const key = `other_${digitCount}`;
          otherStats[key] = (otherStats[key] || 0) + 1;
        }
      }
    });
    
    return { entryStats: stats, otherStats };
  };

  // Calculate statistics by digit count
  const calculateDigitStats = () => {
    const digitStats: { [key: number]: number } = {};
    
    registrations.forEach(reg => {
      if (reg.kit_number) {
        const digitCount = reg.kit_number.trim().length;
        if (digitCount > 0) {
          digitStats[digitCount] = (digitStats[digitCount] || 0) + 1;
        }
      }
    });
    
    return digitStats;
  };

  // Memoize statistics calculations
  const stats = useMemo(() => calculateStats(), [registrations]);
  
  // Filter out entries with 0 count
  const filteredEntryStats = useMemo(() => {
    return Object.fromEntries(
      Object.entries(stats.entryStats).filter(([entry, count]) => {
        return count > 0;
      })
    );
  }, [stats.entryStats]);
  
  const sortedEntries = useMemo(() => {
    return Object.keys(filteredEntryStats)
      .map(Number)
      .sort((a, b) => a - b);
  }, [filteredEntryStats]);
  
  const sortedOtherEntries = useMemo(() => {
    return Object.keys(stats.otherStats)
      .filter(key => stats.otherStats[key] > 0)
      .sort();
  }, [stats.otherStats]);
  
  // Digit count statistics
  const digitStats = useMemo(() => calculateDigitStats(), [registrations]);
  const sortedDigitCounts = useMemo(() => {
    return Object.keys(digitStats)
      .map(Number)
      .sort((a, b) => a - b);
  }, [digitStats]);

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
                Admin Portal
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

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 border-l-4 rounded-lg flex items-start justify-between ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-300 border-green-500'
              : 'bg-red-900/30 text-red-300 border-red-500'
          }`}>
            <div className="flex items-start gap-3">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-11a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
              )}
              <div>
                <p className="font-semibold">{message.type === 'success' ? 'Success' : 'Error'}</p>
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
            <button onClick={() => setMessage(null)} className={`${message.type === 'success' ? 'text-green-300 hover:text-green-200' : 'text-red-300 hover:text-red-200'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 mb-6 border border-gray-700/50">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Admin Portal
              </h1>
              <p className="text-gray-400">Manage registrations and view statistics</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={toggleRegistrationStatus}
                disabled={isTogglingStatus}
                className={`px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  isRegistrationOpen
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                }`}
              >
                {isTogglingStatus ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    {isRegistrationOpen ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Close Registration</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Open Registration</span>
                      </>
                    )}
                  </>
                )}
              </button>
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

          {/* Statistics Cards */}
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

          {/* Analytics Section with Dropdown */}
          {((sortedEntries.length > 0 || sortedOtherEntries.length > 0) || sortedDigitCounts.length > 0) && (
            <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-700/50 mb-6">
              {/* Collapsible Header */}
              <button
                onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
                className="w-full p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-700/30 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-200">
                    Analytics
                  </h2>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isAnalyticsExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="relative">
                  <select
                    value={analyticsView}
                    onChange={(e) => setAnalyticsView(e.target.value as 'entry' | 'digit')}
                    onClick={(e) => e.stopPropagation()}
                    className="appearance-none bg-gray-700/50 border-2 border-gray-600 rounded-xl px-6 py-3 pr-10 text-white font-semibold cursor-pointer hover:border-indigo-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="entry">Distribution by Entry Number</option>
                    <option value="digit">Distribution by Digit Count</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Collapsible Content */}
              {isAnalyticsExpanded && (
                <div className="px-6 md:px-8 pb-6 md:pb-8">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-300">
                      {analyticsView === 'entry' ? 'Distribution by Entry Number' : 'Distribution by Digit Count'}
                    </h3>
                  </div>

                {/* Entry-based Analytics */}
                {analyticsView === 'entry' && (sortedEntries.length > 0 || sortedOtherEntries.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sortedEntries.map(entry => {
                      const count = filteredEntryStats[entry];
                      const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0;
                      
                      return (
                        <div
                          key={entry}
                          className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 p-6 rounded-2xl border-2 border-indigo-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-indigo-600/20 rounded-lg">
                              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              Entry {entry}
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

                {/* Digit Count Analytics */}
                {analyticsView === 'digit' && sortedDigitCounts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sortedDigitCounts.map(digitCount => {
                      const count = digitStats[digitCount];
                      const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0;
                      
                      return (
                        <div
                          key={digitCount}
                          className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-6 rounded-2xl border-2 border-green-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-green-600/20 rounded-lg">
                              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              {digitCount} {digitCount === 1 ? 'Digit' : 'Digits'}
                            </span>
                          </div>
                          <div className="mb-2">
                            <p className="text-3xl font-extrabold text-green-400">{count}</p>
                            <p className="text-sm text-gray-400 mt-1">{percentage}% of total</p>
                          </div>
                          <div className="mt-4 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No data message */}
                {analyticsView === 'entry' && sortedEntries.length === 0 && sortedOtherEntries.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No entry-based data available</p>
                  </div>
                )}
                {analyticsView === 'digit' && sortedDigitCounts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No digit count data available</p>
                  </div>
                )}
              </div>
            )}
            </div>
          )}

          {/* Search and Action Buttons */}
          <div className="mb-4">
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name or kit number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => fetchRegistrations(true)}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fetching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Now
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
                Download CSV ({totalCount})
              </button>
            </div>
            
            {lastRefreshTime && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4 animate-pulse text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last updated: {lastRefreshTime.toLocaleTimeString()}</span>
                <span className="text-green-400 font-semibold">• Auto-refreshing every 2s</span>
              </div>
            )}
          </div>
        </div>

        {/* Registrations Table */}
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
                    WhatsApp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Car Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Attending
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {paginatedRegistrations.map((reg, index) => (
                  <tr key={reg.id} className="hover:bg-gradient-to-r hover:from-indigo-900/30 hover:to-purple-900/30 transition-all duration-200">
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
                      <a href={`tel:${reg.whatsapp_number}`} className="hover:text-indigo-400 transition-colors">
                        {reg.whatsapp_number}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {reg.car_number_plate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        reg.attend_gala === 'Yes'
                          ? 'bg-green-600/30 text-green-300 border border-green-500/30'
                          : 'bg-red-600/30 text-red-300 border border-red-500/30'
                      }`}>
                        {reg.attend_gala}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRegistration(reg);
                            setIsEditMode(false);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-xs font-semibold"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRegistration(reg);
                            handleEditClick(reg);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(reg.id!, reg.full_name)}
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
                {searchTerm ? 'No registrations found matching your search.' : 'No registrations yet. Registrations will appear here when users submit the form.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredRegistrations.length > itemsPerPage && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-800/50 border-t border-gray-700/50">
              <div className="text-sm text-gray-400">
                Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-white">{Math.min(endIndex, filteredRegistrations.length)}</span> of{' '}
                <span className="font-semibold text-white">{filteredRegistrations.length}</span> registrations
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* Registration Details Modal / Edit Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {isEditMode ? '✏️ Edit Registration' : 'Registration Details'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedRegistration(null);
                    setIsEditMode(false);
                    setEditData({});
                  }}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {editMessage && (
                <div className={`mb-6 p-4 rounded-xl border-l-4 ${
                  editMessage.type === 'success' 
                    ? 'bg-green-900/30 text-green-300 border-green-500' 
                    : 'bg-red-900/30 text-red-300 border-red-500'
                }`}>
                  {editMessage.text}
                </div>
              )}

              <div className="space-y-6">
                {(isEditMode ? editData.photo_url : selectedRegistration.photo_url) && (
                  <div className="flex justify-center">
                    <Image
                      src={(isEditMode ? editData.photo_url : selectedRegistration.photo_url) || ''}
                      alt={isEditMode ? (editData.full_name || '') : selectedRegistration.full_name}
                      width={150}
                      height={150}
                      className="rounded-full object-cover border-4 border-indigo-500/50 shadow-xl"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="text-sm font-medium text-gray-400">Full Name</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.full_name || ''}
                        onChange={(e) => handleEditChange('full_name', e.target.value)}
                        className="w-full px-4 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                      />
                    ) : (
                      <p className="text-gray-200 font-semibold text-lg">{selectedRegistration.full_name}</p>
                    )}
                  </div>

                  {/* Kit Number */}
                  <div>
                    <label className="text-sm font-medium text-gray-400">Kit Number</label>
                    {isEditMode ? (
                      <>
                        <input
                          type="text"
                          value={editData.kit_number || ''}
                          onChange={(e) => handleEditChange('kit_number', e.target.value)}
                          onKeyDown={(e) => {
                            // Allow: backspace, delete, tab, escape, enter, and numbers
                            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && !(e.key === 'a' && e.ctrlKey) && !(e.key === 'c' && e.ctrlKey) && !(e.key === 'v' && e.ctrlKey) && !(e.key === 'x' && e.ctrlKey)) {
                              e.preventDefault();
                            }
                          }}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full px-4 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                          placeholder="Numbers only"
                        />
                        <p className="text-xs text-gray-400 mt-1">Only numbers (0-9) are allowed</p>
                      </>
                    ) : (
                      <p className="text-gray-200 font-semibold text-lg">{selectedRegistration.kit_number}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-gray-400">Email</label>
                    {isEditMode ? (
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        className="w-full px-4 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                      />
                    ) : (
                      <p className="text-gray-300">{selectedRegistration.email}</p>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="text-sm font-medium text-gray-400">WhatsApp</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.whatsapp_number || ''}
                        onChange={(e) => handleEditChange('whatsapp_number', e.target.value)}
                        className="w-full px-4 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                      />
                    ) : (
                      <p className="text-gray-300">
                        <a href={`tel:${selectedRegistration.whatsapp_number}`} className="hover:text-indigo-400 transition-colors">
                          {selectedRegistration.whatsapp_number}
                        </a>
                      </p>
                    )}
                  </div>

                  {/* Car Number Plate */}
                  <div>
                    <label className="text-sm font-medium text-gray-400">Car Number Plate</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.car_number_plate || ''}
                        onChange={(e) => handleEditChange('car_number_plate', e.target.value)}
                        className="w-full px-4 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                      />
                    ) : (
                      <p className="text-gray-300">{selectedRegistration.car_number_plate}</p>
                    )}
                  </div>

                  {/* House */}
                  <div>
                    <label className="text-sm font-medium text-gray-400">House</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.house || ''}
                        onChange={(e) => handleEditChange('house', e.target.value)}
                        className="w-full px-4 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                      />
                    ) : (
                      <p className="text-gray-300">{selectedRegistration.house}</p>
                    )}
                  </div>

                  {/* Profession */}
                  <div>
                    <label className="text-sm font-medium text-gray-400">Profession</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.profession || ''}
                        onChange={(e) => handleEditChange('profession', e.target.value)}
                        className="w-full px-4 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                      />
                    ) : (
                      <p className="text-gray-300">{selectedRegistration.profession}</p>
                    )}
                  </div>

                  {/* Attending Gala */}
                  <div>
                    <label className="text-sm font-medium text-gray-400">Attending Gala</label>
                    {isEditMode ? (
                      <select
                        value={editData.attend_gala || 'Yes'}
                        onChange={(e) => handleEditChange('attend_gala', e.target.value)}
                        className="w-full px-4 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        selectedRegistration.attend_gala === 'Yes'
                          ? 'bg-green-600/30 text-green-300 border border-green-500/30'
                          : 'bg-red-600/30 text-red-300 border border-red-500/30'
                      }`}>
                        {selectedRegistration.attend_gala}
                      </span>
                    )}
                  </div>

                  {/* Morale */}
                  <div>
                    <label className="text-sm font-medium text-gray-400">Morale</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.morale || ''}
                        onChange={(e) => handleEditChange('morale', e.target.value)}
                        className="w-full px-4 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                      />
                    ) : (
                      <p className="text-gray-300">{selectedRegistration.morale}</p>
                    )}
                  </div>

                  {/* Excited for Gala */}
                  <div>
                    <label className="text-sm font-medium text-gray-400">Excited for Gala</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.excited_for_gala || ''}
                        onChange={(e) => handleEditChange('excited_for_gala', e.target.value)}
                        className="w-full px-4 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                      />
                    ) : (
                      <p className="text-gray-300">{selectedRegistration.excited_for_gala}</p>
                    )}
                  </div>

                  {/* Postal Address */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-400">Postal Address</label>
                    {isEditMode ? (
                      <textarea
                        value={editData.postal_address || ''}
                        onChange={(e) => handleEditChange('postal_address', e.target.value)}
                        className="w-full px-4 py-2 mt-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 resize-none h-24"
                      />
                    ) : (
                      <p className="text-gray-300">{selectedRegistration.postal_address}</p>
                    )}
                  </div>

                  {/* Registered On */}
                  {selectedRegistration.created_at && !isEditMode && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">Registered On</label>
                      <p className="text-gray-300">
                        {new Date(selectedRegistration.created_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 flex-wrap">
                {isEditMode ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={editLoading}
                      className="bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={editLoading}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {editLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditClick(selectedRegistration)}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedRegistration.id!, selectedRegistration.full_name)}
                      className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      Delete Registration
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRegistration(null);
                        setIsEditMode(false);
                      }}
                      className="bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full border border-gray-700/50">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Change Password
                </h2>
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

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white backdrop-blur-sm hover:border-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white backdrop-blur-sm hover:border-gray-500"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Confirm New Password</label>
                  <input
                    type="password"
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
                    className="bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
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