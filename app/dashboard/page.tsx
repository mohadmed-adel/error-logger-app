'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface ErrorLog {
  id: string;
  message: string;
  stack: string | null;
  level: 'error' | 'warning' | 'info';
  metadata: string | null;
  serverUrl: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [expandedStacks, setExpandedStacks] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    message: '',
    stack: '',
    level: 'error' as 'error' | 'warning' | 'info',
    metadata: '',
    serverUrl: '',
  });

  useEffect(() => {
    fetchErrors();
  }, [filter]);

  const fetchErrors = async () => {
    try {
      const level = filter === 'all' ? '' : filter;
      const url = level ? `/api/errors?level=${level}` : '/api/errors';
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let metadata = null;
      if (formData.metadata.trim()) {
        try {
          metadata = JSON.parse(formData.metadata);
        } catch {
          metadata = { raw: formData.metadata };
        }
      }

      const response = await fetch('/api/errors/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: formData.message,
          stack: formData.stack || undefined,
          level: formData.level,
          metadata,
          serverUrl: formData.serverUrl || undefined,
        }),
      });

      if (response.ok) {
        setFormData({ message: '', stack: '', level: 'error', metadata: '', serverUrl: '' });
        fetchErrors();
      } else {
        alert('Failed to log error');
      }
    } catch (error) {
      console.error('Error logging error:', error);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this error log?')) {
      return;
    }

    try {
      const response = await fetch(`/api/errors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchErrors();
      } else {
        alert('Failed to delete error');
      }
    } catch (error) {
      console.error('Error deleting error:', error);
      alert('An error occurred');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL error logs? This action cannot be undone.')) {
      return;
    }

    setClearing(true);
    try {
      const response = await fetch('/api/errors', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setErrors([]);
        alert(`Successfully cleared ${data.deletedCount} error log(s)`);
      } else {
        alert(data.error || 'Failed to clear errors');
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
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
              Error Logger Dashboard
            </h1>
            <button
              onClick={() => {
                signOut({ callbackUrl: '/' });
              }}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Error Logging Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                Log New Error
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                    placeholder="Error message..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                    Stack Trace (Optional)
                  </label>
                  <textarea
                    value={formData.stack}
                    onChange={(e) => setFormData({ ...formData, stack: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 font-mono text-sm"
                    placeholder="Stack trace..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                    Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                  >
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                    Server URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.serverUrl}
                    onChange={(e) => setFormData({ ...formData, serverUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                    Metadata (JSON, Optional)
                  </label>
                  <textarea
                    value={formData.metadata}
                    onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 font-mono text-sm"
                    placeholder='{"key": "value"}'
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                >
                  {submitting ? 'Logging...' : 'Log Error'}
                </button>
              </form>
            </div>
          </div>

          {/* Error List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                  Error Logs
                </h2>
                <div className="flex gap-2">
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
                  <button
                    onClick={handleClearAll}
                    disabled={clearing || errors.length === 0 || loading}
                    className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    title={errors.length === 0 ? 'No errors to clear' : 'Clear all error logs'}
                  >
                    {clearing ? 'Clearing...' : 'Clear All'}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
                  Loading...
                </div>
              ) : errors.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
                  No errors found
                </div>
              ) : (
                <div className="space-y-4">
                  {errors.map((error) => (
                    <div
                      key={error.id}
                      className={`border rounded-lg p-4 ${getLevelColor(error.level)}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold capitalize">{error.level}</span>
                            <span className="text-xs opacity-75">
                              {formatDate(error.createdAt)}
                            </span>
                          </div>
                          <p className="font-medium mb-2">{error.message}</p>
                          {error.serverUrl && (
                            <div className="mb-2">
                              <span className="text-xs opacity-75">Server: </span>
                              <a
                                href={error.serverUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {error.serverUrl}
                              </a>
                            </div>
                          )}
                          {error.stack && (
                            <div className="mt-2">
                              <button
                                onClick={() => toggleStackExpansion(error.id)}
                                className="text-xs font-semibold mb-1 opacity-75 hover:opacity-100 transition-opacity flex items-center gap-1"
                              >
                                <span>Stack Trace:</span>
                                <span>{expandedStacks.has(error.id) ? '▼' : '▶'}</span>
                              </button>
                              <pre className="text-xs bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto font-mono">
                                {expandedStacks.has(error.id) 
                                  ? error.stack 
                                  : getFirstNLines(error.stack, 3)}
                              </pre>
                            </div>
                          )}
                          {error.metadata && (
                            <div className="mt-2">
                              <pre className="text-xs bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto">
                                {error.metadata}
                              </pre>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(error.id)}
                          className="ml-4 px-3 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        >
                          Delete
                        </button>
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

