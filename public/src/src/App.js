import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Set API URL - this will be replaced during deployment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000/api';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [indicators, setIndicators] = useState([]);
  const [entries, setEntries] = useState([]);
  const [message, setMessage] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/profile`);
      setUser(res.data.user);
      fetchDepartments();
      fetchEntries(res.data.user.centerId);
    } catch (error) {
      localStorage.removeItem('token');
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_URL}/departments`);
      setDepartments(res.data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchEntries = async (centerId) => {
    if (!centerId) return;
    try {
      const res = await axios.get(`${API_URL}/data-entries/center/${centerId}`);
      setEntries(res.data.entries || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const fetchIndicators = async (deptId) => {
    try {
      const res = await axios.get(`${API_URL}/departments/${deptId}/indicators`);
      setIndicators(res.data.indicators);
    } catch (error) {
      console.error('Error fetching indicators:', error);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post(`${API_URL}/auth/login`, { 
        email: email.toLowerCase(), 
        password 
      });
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setEmail('');
      setPassword('');
      
      fetchDepartments();
      fetchEntries(user.centerId);
    } catch (error) {
      setMessage('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setEntries([]);
    setSelectedDept('');
    setIndicators([]);
  };

  const saveData = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.target);
    const entryMonth = formData.get('entryMonth');
    
    const values = indicators.map(ind => ({
      indicatorId: ind.id,
      value: parseFloat(formData.get(ind.code)) || 0,
      notes: formData.get(`${ind.code}_notes`) || ''
    })).filter(v => v.value > 0 || v.notes);

    try {
      await axios.post(`${API_URL}/data-entries`, {
        centerId: user.centerId,
        departmentId: selectedDept,
        entryMonth: entryMonth + '-01',
        values,
        status: 'submitted'
      });

      setMessage('Data saved successfully!');
      fetchEntries(user.centerId);
      setSelectedDept('');
      setIndicators([]);
    } catch (error) {
      setMessage('Error saving data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Diagnostic Data Platform</h1>
            <p className="text-gray-500 mt-2">Sign in to access your dashboard</p>
          </div>

          {message && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
          )}

          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@diagdata.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p className="font-semibold">Demo Credentials:</p>
            <p>Email: admin@diagdata.com</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Diagnostic Data Platform</h1>
              {user.centerName && (
                <p className="text-sm text-gray-500">{user.centerName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.fullName}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Data Entry Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Monthly Data Entry
              </h2>

              <form onSubmit={saveData} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => {
                        setSelectedDept(e.target.value);
                        if (e.target.value) fetchIndicators(e.target.value);
                      }}
                      className="input-field"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month *
                    </label>
                    <input
                      type="month"
                      name="entryMonth"
                      defaultValue={new Date().toISOString().slice(0, 7)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                {selectedDept && indicators.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 border-b pb-2">Indicators</h3>
                    
                    <div className="space-y-4">
                      {indicators.map((indicator) => (
                        <div key={indicator.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start p-4 bg-gray-50 rounded-lg">
                          <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-900">
                              {indicator.name}
                            </label>
                            <p className="text-xs text-gray-500">{indicator.unit}</p>
                          </div>
                          <div className="md:col-span-1">
                            <input
                              type="number"
                              step={indicator.data_type === 'decimal' ? '0.01' : '1'}
                              name={indicator.code}
                              className="input-field"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <input
                              type="text"
                              name={`${indicator.code}_notes`}
                              className="input-field text-sm"
                              placeholder="Notes (optional)"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{loading ? 'Saving...' : 'Submit Data'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Recent Entries Sidebar */}
          <div>
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h2>
              
              {entries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No entries yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {entries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {entry.department_name || 'General'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.entry_month).toLocaleDateString('en-US', { 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                          entry.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="card mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{entries.length}</p>
                  <p className="text-xs text-gray-600">Total Entries</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {entries.filter(e => e.status === 'approved').length}
                  </p>
                  <p className="text-xs text-gray-600">Approved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
