'use client';

import { useEffect, useState, useCallback } from 'react';

interface ErrorLog {
  id: string;
  message: string;
  stack: string | null;
  level: 'error' | 'warning' | 'info';
  metadata: string | null;
  serverUrl: string | null;
  userId: string;
  userSecretKey: string | null;
  createdAt: string;
}

export default function Home() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [serverUrlFilter, setServerUrlFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [expandedStacks, setExpandedStacks] = useState<Set<string>>(new Set());

  const fetchErrors = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      const level = filter === 'all' ? '' : filter;
      if (level) params.append('level', level);
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serverUrlFilter) params.append('serverUrl', serverUrlFilter);
      if (userIdFilter) params.append('userId', userIdFilter);
      
      params.append('limit', '20');
      
      const url = `/api/errors/public?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setErrors(data.errors || []);
      }
    } catch (error) {
      console.error('Error fetching errors:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, startDate, endDate, serverUrlFilter, userIdFilter]);

  useEffect(() => {
    fetchErrors();
    // Auto-refresh disabled - user can manually refresh if needed
    // const interval = setInterval(fetchErrors, 5000);
    // return () => clearInterval(interval);
  }, [fetchErrors]);

  const clearFilters = () => {
    setFilter('all');
    setStartDate('');
    setEndDate('');
    setServerUrlFilter('');
    setUserIdFilter('');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchErrors();
    setRefreshing(false);
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL error logs? This action cannot be undone.')) {
      return;
    }

    setClearing(true);
    try {
      const response = await fetch('/api/errors/clear-all', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setErrors([]);
        alert(`Successfully cleared ${data.deletedCount} error log(s)`);
        fetchErrors(); // Refresh the list
      } else {
        if (response.status === 401) {
          alert('Please log in to clear errors. Redirecting to login...');
          window.location.href = '/login';
        } else {
          alert(data.error || 'Failed to clear errors');
        }
      }
    } catch (error) {
      console.error('Error clearing errors:', error);
      alert('An error occurred while clearing errors');
    } finally {
      setClearing(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const parseMetadata = (metadata: string | null) => {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata);
    } catch {
      return metadata;
    }
  };

  const formatMetadata = (metadata: string | null) => {
    const parsed = parseMetadata(metadata);
    if (!parsed) return null;
    return JSON.stringify(parsed, null, 2);
  };

  const getFirstNLines = (text: string, n: number) => {
    const lines = text.split('\n');
    return lines.slice(0, n).join('\n');
  };

  const toggleStackExpansion = (errorId: string) => {
    setExpandedStacks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(errorId)) {
        newSet.delete(errorId);
      } else {
        newSet.add(errorId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 text-black dark:text-zinc-50">
            Error Logger API
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-2">
            Public API for logging application errors
          </p>
          <p className="text-lg text-zinc-500 dark:text-zinc-500">
            No authentication required - simply POST your errors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* API Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 sticky top-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  title="Refresh error list"
                >
                  {refreshing ? 'Refreshing...' : '🔄 Refresh'}
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={clearing || errors.length === 0 || loading}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  title={errors.length === 0 ? 'No errors to clear' : 'Clear all error logs'}
                >
                  {clearing ? 'Clearing...' : 'Clear All'}
                </button>
              </div>
              <h2 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50">
                API Endpoint
              </h2>
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded p-4 mb-4">
                <code className="text-sm text-black dark:text-zinc-50">
                  POST /api/errors/public
                </code>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm">
                Send error logs to this endpoint. User ID or email is required.
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-950 rounded p-4 mb-6">
                <pre className="text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto">
{`{
  "message": "Error message",
  "userId": "user@example.com",
  "level": "error",
  "serverUrl": "https://example.com",
  "userSecretKey": "optional",
  "metadata": {}
}`}
                </pre>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                  <h3 className="font-semibold mb-1 text-black dark:text-zinc-50">Public API</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">No authentication required</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                  <h3 className="font-semibold mb-1 text-black dark:text-zinc-50">Required: userId</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">User ID (CUID) or email address</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                  <h3 className="font-semibold mb-1 text-black dark:text-zinc-50">Optional: userSecretKey</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">Additional identifier for the user</p>
                </div>
              </div>
            </div>
          </div>

          {/* Errors List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
                  Recent Errors
                </h2>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                >
                  <option value="all">All</option>
                  <option value="error">Errors</option>
                  <option value="warning">Warnings</option>
                  <option value="info">Info</option>
                </select>
              </div>

              {/* Filters Section */}
              <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-black dark:text-zinc-50">Filters</h3>
                  {(startDate || endDate || serverUrlFilter || userIdFilter) && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                      Server URL
                    </label>
                    <input
                      type="text"
                      value={serverUrlFilter}
                      onChange={(e) => setServerUrlFilter(e.target.value)}
                      placeholder="Filter by server URL"
                      className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={userIdFilter}
                      onChange={(e) => setUserIdFilter(e.target.value)}
                      placeholder="Filter by user ID"
                      className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 font-mono"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
                  Loading...
                </div>
              ) : errors.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
                  No errors found. Start logging errors using the API endpoint!
                </div>
              ) : (
                <div className="space-y-4">
                  {errors.map((error) => (
                    <div
                      key={error.id}
                      className={`border rounded-lg p-4 ${getLevelColor(error.level)}`}
                    >
                      <div className="flex-1">
                        {/* Header with Level and Date */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold capitalize">{error.level}</span>
                            <span className="text-xs opacity-75">
                              {formatDate(error.createdAt)}
                            </span>
                          </div>
                          <span className="text-xs opacity-60 font-mono">ID: {error.id}</span>
                        </div>

                        {/* Error Message */}
                        <p className="font-medium mb-3 text-base">{error.message}</p>

                        {/* Error Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-xs">
                          {error.serverUrl && (
                            <div>
                              <span className="opacity-75 font-semibold">Server URL: </span>
                              <a
                                href={error.serverUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                              >
                                {error.serverUrl}
                              </a>
                            </div>
                          )}
                          {error.userSecretKey && (
                            <div>
                              <span className="opacity-75 font-semibold">User Secret Key: </span>
                              <span className="font-mono break-all">{error.userSecretKey}</span>
                            </div>
                          )}
                          <div>
                            <span className="opacity-75 font-semibold">User ID: </span>
                            <span className="font-mono">{error.userId}</span>
                          </div>
                        </div>

                        {/* Stack Trace */}
                        {error.stack && (
                          <div className="mb-2">
                            <button
                              onClick={() => toggleStackExpansion(error.id)}
                              className="text-xs font-semibold mb-1 opacity-75 hover:opacity-100 transition-opacity flex items-center gap-1"
                            >
                              <span>Stack Trace:</span>
                              <span>{expandedStacks.has(error.id) ? '▼' : '▶'}</span>
                            </button>
                            <pre className="text-xs bg-black/10 dark:bg-white/10 p-3 rounded overflow-x-auto font-mono">
                              {expandedStacks.has(error.id) 
                                ? error.stack 
                                : getFirstNLines(error.stack, 3)}
                            </pre>
                          </div>
                        )}

                        {/* Metadata */}
                        {error.metadata && (
                          <div className="mt-2">
                            <div className="text-xs font-semibold mb-1 opacity-75">Metadata:</div>
                            <pre className="text-xs bg-black/10 dark:bg-white/10 p-3 rounded overflow-x-auto font-mono">
                              {formatMetadata(error.metadata) || error.metadata}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
