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

function ParentDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isMounted, setIsMounted] = useState(false);

  // States for Notification Center
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const fetchRecords = useCallback(async () => {
    if (!currentUser?.studentId) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`https://base-platform-api.onrender.com/api/records/${currentUser.studentId}`);
      const sortedRecords = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecords(sortedRecords);

      // Notification Logic
      const latestRecordTimestamp = sortedRecords.length > 0 ? new Date(sortedRecords[0].createdAt._seconds * 1000).getTime() : 0;
      const lastViewedTimestamp = localStorage.getItem(`lastViewed_${currentUser.uid}`) || 0;
      if (latestRecordTimestamp > lastViewedTimestamp) {
        setHasUnread(true);
      }
      setNotifications(sortedRecords.slice(0, 5));

    } catch (err) {
      showToast('error', 'Could not load academic records.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.studentId, currentUser?.uid]);

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
  
  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (hasUnread) {
      setHasUnread(false);
      localStorage.setItem(`lastViewed_${currentUser.uid}`, Date.now());
    }
  };

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

  const downloadableNotes = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return records.filter(r => r.type === 'feedback' && urlRegex.test(r.score));
  }, [records]);

  const SidebarButton = ({ viewName, children }) => (
    <button onClick={() => setActiveView(viewName)} className={`w-full text-left px-4 py-2 rounded-md transition-colors ${activeView === viewName ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}>{children}</button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Parent Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={handleNotificationClick} className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a1 1 0 10-2 0v.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {hasUnread && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-800"></span>}
              </button>
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20">
                  <div className="p-3"><h4 className="text-sm font-semibold text-white">Recent Updates</h4></div>
                  <ul className="divide-y divide-slate-700">
                    {notifications.length > 0 ? notifications.map(n => (
                      <li key={n.id} className="p-3 text-sm">
                        <p className="font-semibold text-blue-400">{n.type.charAt(0).toUpperCase() + n.type.slice(1)} Update</p>
                        <p className="text-gray-300 truncate">{n.subject} - {n.score}</p>
                        <p className="text-xs text-gray-500">{new Date(n.date).toLocaleDateString()}</p>
                      </li>
                    )) : <li className="p-3 text-sm text-center text-gray-400">No new notifications.</li>}
                  </ul>
                </div>
              )}
            </div>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className={`md:col-span-1 bg-slate-800/50 p-4 rounded-lg shadow-lg border border-slate-700 self-start sticky top-24 transition-all duration-1000 ease-out ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <h3 className="text-lg font-semibold mb-4">Menu</h3>
            <nav className="space-y-2">
              <SidebarButton viewName="dashboard">Dashboard</SidebarButton>
              <SidebarButton viewName="marks">Child's Marks</SidebarButton>
              <SidebarButton viewName="attendance">Child's Attendance</SidebarButton>
              <SidebarButton viewName="completion">Chapter Completion</SidebarButton>
              <SidebarButton viewName="resources">Resource Hub</SidebarButton>
              <SidebarButton viewName="feedback">All Feedback</SidebarButton>
              <SidebarButton viewName="settings">Settings</SidebarButton>
            </nav>
          </aside>

          <div className={`md:col-span-3 transition-all duration-1000 ease-out animate-delay-200 ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <h2 className="text-xl font-semibold text-gray-200 mb-2">Welcome, {currentUser?.name || 'Parent'}!</h2>
            <p className="text-md text-gray-400 mb-6">Viewing academic records for your child.</p>
            
            {isLoading ? <SkeletonLoader /> : (
              <>
                {activeView === 'dashboard' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700"><h4 className="text-gray-400 text-sm font-medium">Child's Overall Attendance</h4><p className="text-3xl font-bold">{averageAttendance}</p></div>
                      <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700"><h4 className="text-gray-400 text-sm font-medium">Total Marks Recorded</h4><p className="text-3xl font-bold">{totalMarks}</p></div>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                      <h3 className="text-lg font-medium text-white mb-4">Recent Feedback & Notes</h3>
                      {getRecordsByType('feedback').length > 0 ? (
                        <ul className="divide-y divide-slate-700">{getRecordsByType('feedback').slice(0, 3).map(record => (<li key={record.id} className="py-4"><p className="text-sm text-gray-300 mb-1"><Linkify text={record.score} /></p><p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p></li>))}</ul>
                      ) : <EmptyState message="No recent feedback or notes for your child." />}
                    </div>
                  </div>
                )}

                {activeView === 'resources' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">Resource Hub (Downloadable Notes)</h3>
                    {downloadableNotes.length > 0 ? (
                      <ul className="divide-y divide-slate-700">{downloadableNotes.map(record => (<li key={record.id} className="py-4 flex justify-between items-center"><div><p className="text-sm text-gray-300">Note from {new Date(record.date).toLocaleDateString()}</p><p className="text-xs text-gray-500 truncate max-w-xs">{record.score}</p></div><a href={record.score.match(/(https?:\/\/[^\s]+)/g)[0]} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">Download</a></li>))}</ul>
                    ) : <EmptyState message="Downloadable notes and links from the teacher will appear here." />}
                  </div>
                )}
                
                {activeView === 'marks' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">Child's Marks</h3>
                    {getRecordsByType('mark').length > 0 ? (
                      <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-700"><thead className="bg-slate-800"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subject</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Score</th></tr></thead><tbody className="bg-slate-900/50 divide-y divide-slate-700">{getRecordsByType('mark').map(record => (<tr key={record.id} className="hover:bg-slate-800"><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{record.date}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{record.subject}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{record.score}</td></tr>))}</tbody></table></div>
                    ) : <EmptyState message="Your child's marks will appear here." />}
                  </div>
                )}
                
                {activeView === 'attendance' && (
                   <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">Child's Attendance</h3>
                    {getRecordsByType('attendance').length > 0 ? (
                      <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-700"><thead className="bg-slate-800"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th></tr></thead><tbody className="bg-slate-900/50 divide-y divide-slate-700">{getRecordsByType('attendance').map(record => (<tr key={record.id} className="hover:bg-slate-800"><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{record.date}</td><td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${record.score === 'Present' ? 'text-green-400' : 'text-red-400'}`}>{record.score}</td></tr>))}</tbody></table></div>
                    ) : <EmptyState message="Your child's attendance records will appear here." />}
                  </div>
                )}
                
                {activeView === 'completion' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">Chapter Completion</h3>
                    {getRecordsByType('completion').length > 0 ? (
                      <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-700"><thead className="bg-slate-800"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subject</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Chapter</th></tr></thead><tbody className="bg-slate-900/50 divide-y divide-slate-700">{getRecordsByType('completion').map(record => (<tr key={record.id} className="hover:bg-slate-800"><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{record.date}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-white">{record.subject}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{record.score}</td></tr>))}</tbody></table></div>
                    ) : <EmptyState message="Chapter completion updates for your child will appear here." />}
                  </div>
                )}

                {activeView === 'feedback' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">All Feedback & Notes</h3>
                    {getRecordsByType('feedback').length > 0 ? (
                      <ul className="divide-y divide-slate-700">{getRecordsByType('feedback').map(record => (<li key={record.id} className="py-4"><p className="text-sm text-gray-300 mb-1"><Linkify text={record.score} /></p><p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p></li>))}</ul>
                    ) : <EmptyState message="Feedback and notes for your child will appear here." />}
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

export default ParentDashboard;
