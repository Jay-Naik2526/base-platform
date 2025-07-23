import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase';
import { updatePassword, onAuthStateChanged } from 'firebase/auth';
import Toast from '../components/Toast';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

// Helper component to make links in text clickable
const Linkify = ({ text }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return <>{text.split(urlRegex).map((part, i) => urlRegex.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{part}</a> : part)}</>;
};

function StudentDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const fetchRecords = useCallback(async () => {
    if (!currentUser?.uid) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`https://base-platform-api.onrender.com/api/records/${currentUser.uid}`);
      setRecords(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      showToast('error', 'Could not load academic records.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRecords();
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, fetchRecords]);

  const averageAttendance = useMemo(() => {
    const attendanceRecords = records.filter(r => r.type === 'attendance');
    if (attendanceRecords.length === 0) return 'N/A';
    const presentCount = attendanceRecords.filter(r => r.score === 'Present').length;
    return `${((presentCount / attendanceRecords.length) * 100).toFixed(0)}%`;
  }, [records]);

  const totalMarks = useMemo(() => {
    return records.filter(r => r.type === 'mark').length;
  }, [records]);

  const handleLogout = () => {
    localStorage.clear();
    auth.signOut();
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return showToast('error', 'Passwords do not match.');
    if (newPassword.length < 6) return showToast('error', 'Password must be at least 6 characters long.');
    try {
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword(''); setConfirmPassword('');
      showToast('success', 'Password updated successfully!');
    } catch (err) {
      showToast('error', err.code === 'auth/requires-recent-login' ? 'Please log out and log back in to change password.' : 'Failed to update password.');
    }
  };

  const getRecordsByType = (type) => records.filter(r => r.type === type);

  const SidebarButton = ({ viewName, children }) => (
    <button onClick={() => setActiveView(viewName)} className={`w-full text-left px-4 py-2 rounded-md transition-colors ${activeView === viewName ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}>{children}</button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className={`md:col-span-1 bg-slate-800/50 p-4 rounded-lg shadow-lg border border-slate-700 self-start sticky top-24 transition-all duration-1000 ease-out ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <h3 className="text-lg font-semibold mb-4">Menu</h3>
            <nav className="space-y-2">
              <SidebarButton viewName="dashboard">Dashboard</SidebarButton>
              <SidebarButton viewName="marks">My Marks</SidebarButton>
              <SidebarButton viewName="attendance">My Attendance</SidebarButton>
              <SidebarButton viewName="completion">Chapter Completion</SidebarButton>
              <SidebarButton viewName="feedback">Feedback & Notes</SidebarButton>
              <SidebarButton viewName="settings">Settings</SidebarButton>
            </nav>
          </aside>

          <div className={`md:col-span-3 transition-all duration-1000 ease-out animate-delay-200 ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <h2 className="text-xl font-semibold text-gray-200 mb-6">Welcome, {currentUser?.name || 'Student'}!</h2>
            
            {isLoading ? <SkeletonLoader /> : (
              <>
                {activeView === 'dashboard' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                        <h4 className="text-gray-400 text-sm font-medium">Overall Attendance</h4>
                        <p className="text-3xl font-bold">{averageAttendance}</p>
                      </div>
                       <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                        <h4 className="text-gray-400 text-sm font-medium">Total Marks Recorded</h4>
                        <p className="text-3xl font-bold">{totalMarks}</p>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                      <h3 className="text-lg font-medium text-white mb-4">Recent Feedback & Notes</h3>
                      {getRecordsByType('feedback').length > 0 ? (
                        <ul className="divide-y divide-slate-700">
                          {getRecordsByType('feedback').slice(0, 3).map(record => (
                            <li key={record.id} className="py-4">
                              <p className="text-sm text-gray-300 mb-1"><Linkify text={record.score} /></p>
                              <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                            </li>
                          ))}
                        </ul>
                      ) : <EmptyState message="No recent feedback or notes." />}
                    </div>
                  </div>
                )}

                {activeView === 'marks' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">My Marks</h3>
                    {getRecordsByType('mark').length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                          <thead className="bg-slate-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subject</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Score</th>
                            </tr>
                          </thead>
                          <tbody className="bg-slate-900/50 divide-y divide-slate-700">
                            {getRecordsByType('mark').map(record => (
                              <tr key={record.id} className="hover:bg-slate-800">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{record.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{record.subject}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{record.score}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <EmptyState message="Your marks will appear here once they are updated." />}
                  </div>
                )}
                
                {activeView === 'attendance' && (
                   <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">My Attendance</h3>
                    {getRecordsByType('attendance').length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                          <thead className="bg-slate-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-slate-900/50 divide-y divide-slate-700">
                            {getRecordsByType('attendance').map(record => (
                              <tr key={record.id} className="hover:bg-slate-800">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{record.date}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${record.score === 'Present' ? 'text-green-400' : 'text-red-400'}`}>{record.score}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <EmptyState message="Your attendance records will appear here." />}
                  </div>
                )}
                
                {activeView === 'completion' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">Chapter Completion</h3>
                    {getRecordsByType('completion').length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                          <thead className="bg-slate-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subject</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Chapter</th>
                            </tr>
                          </thead>
                          <tbody className="bg-slate-900/50 divide-y divide-slate-700">
                            {getRecordsByType('completion').map(record => (
                              <tr key={record.id} className="hover:bg-slate-800">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{record.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{record.subject}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{record.score}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <EmptyState message="Chapter completion updates will appear here." />}
                  </div>
                )}

                {activeView === 'feedback' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">Feedback & Notes from Teacher</h3>
                    {getRecordsByType('feedback').length > 0 ? (
                      <ul className="divide-y divide-slate-700">
                        {getRecordsByType('feedback').map(record => (
                          <li key={record.id} className="py-4">
                            <p className="text-sm text-gray-300 mb-1"><Linkify text={record.score} /></p>
                            <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                          </li>
                        ))}
                      </ul>
                    ) : <EmptyState message="Feedback and notes from your teacher will appear here." />}
                  </div>
                )}

                {activeView === 'settings' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">Change Your Password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div><label className="block text-sm font-medium text-gray-300">New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                      <div><label className="block text-sm font-medium text-gray-300">Confirm New Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold">Update Password</button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;
