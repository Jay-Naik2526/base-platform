import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase';
import { updatePassword, onAuthStateChanged } from 'firebase/auth';
import Toast from '../components/Toast';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

// --- Reusable Modal Component ---
const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, recentActivity: [] });
  
  // Roster filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  // Form states
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentBatch, setStudentBatch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [subject, setSubject] = useState('');
  const [score, setScore] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedbackTarget, setFeedbackTarget] = useState('student');
  const [feedbackStudent, setFeedbackStudent] = useState('');
  const [feedbackBatch, setFeedbackBatch] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [completionTarget, setCompletionTarget] = useState('student');
  const [completionStudent, setCompletionStudent] = useState('');
  const [completionBatch, setCompletionBatch] = useState('');
  const [completionSubject, setCompletionSubject] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', batch: '' });

  // Bulk attendance states
  const [bulkAttendanceBatch, setBulkAttendanceBatch] = useState('');
  const [bulkAttendanceData, setBulkAttendanceData] = useState({});
  const [bulkAttendanceDate, setBulkAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // General UI feedback
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsRes, statsRes, adminsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/students'),
        axios.get('http://localhost:5000/api/admin/stats'),
        axios.get('http://localhost:5000/api/admins')
      ]);
      setStudents(studentsRes.data);
      setStats(statsRes.data);
      setAdmins(adminsRes.data);
    } catch (err) {
      showToast('error', 'Could not load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData();
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, fetchData]);

  const filteredStudents = useMemo(() => students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) && (batchFilter === '' || s.batch === batchFilter)), [students, searchTerm, batchFilter]);
  const uniqueBatches = [...new Set(students.map(s => s.batch))];

  const handleLogout = () => {
    localStorage.clear();
    auth.signOut();
    navigate('/login');
  };

  // --- FORM HANDLERS ---
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/register', { name: studentName, email: studentEmail, password: studentPassword, batch: studentBatch, role: 'student' });
      setStudentName(''); setStudentEmail(''); setStudentPassword(''); setStudentBatch('');
      fetchData();
      showToast('success', 'Student added successfully!');
      setActiveView('roster');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to add student.');
    }
  };

  const handleAddMark = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return showToast('error', 'Please select a student.');
    try {
      await axios.post('http://localhost:5000/api/records/add', { studentId: selectedStudent, type: 'mark', subject, score, date });
      setSelectedStudent(''); setSubject(''); setScore('');
      fetchData();
      showToast('success', 'Mark added successfully!');
    } catch (err) {
      showToast('error', 'Failed to add mark.');
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (feedbackTarget === 'student') {
        if (!feedbackStudent) return showToast('error', 'Please select a student.');
        response = await axios.post('http://localhost:5000/api/records/add', { studentId: feedbackStudent, type: 'feedback', subject: 'Teacher Feedback', score: feedbackMessage, date: new Date().toISOString().split('T')[0] });
      } else {
        if (!feedbackBatch) return showToast('error', 'Please select a batch.');
        response = await axios.post('http://localhost:5000/api/feedback/batch', { batch: feedbackBatch, message: feedbackMessage, date: new Date().toISOString().split('T')[0] });
      }
      setFeedbackStudent(''); setFeedbackBatch(''); setFeedbackMessage('');
      fetchData();
      showToast('success', response.data.message);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to send feedback.');
    }
  };

  const handleAddCompletion = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (completionTarget === 'student') {
        if (!completionStudent) return showToast('error', 'Please select a student.');
        response = await axios.post('http://localhost:5000/api/records/add', { studentId: completionStudent, type: 'completion', subject: completionSubject, score: chapterName, date: completionDate });
      } else {
        if (!completionBatch) return showToast('error', 'Please select a batch.');
        response = await axios.post('http://localhost:5000/api/completion/batch', { batch: completionBatch, subject: completionSubject, chapterName: chapterName, date: completionDate });
      }
      setCompletionStudent(''); setCompletionBatch(''); setCompletionSubject(''); setChapterName('');
      fetchData();
      showToast('success', response.data.message);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to add update.');
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/student/${studentId}`);
        showToast('success', 'Student deleted successfully.');
        fetchData();
      } catch (err) {
        showToast('error', err.response?.data?.message || 'Failed to delete student.');
      }
    }
  };
  
  const handleAddNewAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/register', { name: newAdminName, email: newAdminEmail, password: newAdminPassword, role: 'admin' });
      setNewAdminName(''); setNewAdminEmail(''); setNewAdminPassword('');
      fetchData();
      showToast('success', 'New admin created successfully!');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to create admin.');
    }
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

  const openEditModal = (student) => {
    setEditingStudent(student);
    setEditForm({ name: student.name, batch: student.batch });
    setIsEditModalOpen(true);
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/student/${editingStudent.id}`, editForm);
      setIsEditModalOpen(false);
      fetchData();
      showToast('success', 'Student updated successfully!');
    } catch (err) {
      showToast('error', 'Failed to update student.');
    }
  };

  const handleBulkAttendanceChange = (studentId, status) => {
    setBulkAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleBulkAttendanceSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/attendance/batch', { attendanceData: bulkAttendanceData, date: bulkAttendanceDate });
      setBulkAttendanceBatch('');
      setBulkAttendanceData({});
      fetchData();
      showToast('success', 'Bulk attendance marked!');
    } catch (err) {
      showToast('error', 'Failed to mark attendance.');
    }
  };

  const SidebarButton = ({ viewName, children }) => (
    <button onClick={() => setActiveView(viewName)} className={`w-full text-left px-4 py-2 rounded-md transition-colors ${activeView === viewName ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}>{children}</button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1 bg-slate-800/50 p-4 rounded-lg shadow-lg border border-slate-700 self-start sticky top-24">
            <h3 className="text-lg font-semibold mb-4">Menu</h3>
            <nav className="space-y-2">
              <SidebarButton viewName="dashboard">Dashboard</SidebarButton>
              <SidebarButton viewName="roster">Student Roster</SidebarButton>
              <SidebarButton viewName="bulkAttendance">Bulk Attendance</SidebarButton>
              <SidebarButton viewName="addStudent">Add Student</SidebarButton>
              <SidebarButton viewName="addMark">Add Mark</SidebarButton>
              <SidebarButton viewName="addCompletion">Chapter Completion</SidebarButton>
              <SidebarButton viewName="sendFeedback">Send Feedback / Note</SidebarButton>
              <SidebarButton viewName="settings">Settings</SidebarButton>
            </nav>
          </aside>

          <div className="md:col-span-3">
            <h2 className="text-xl font-semibold text-gray-200 mb-6">Welcome, {currentUser?.name || 'Admin'}!</h2>
            
            {isLoading ? <SkeletonLoader /> : (
              <>
                {activeView === 'dashboard' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                        <h4 className="text-gray-400 text-sm font-medium">Total Students</h4>
                        <p className="text-3xl font-bold">{stats.totalStudents}</p>
                      </div>
                       <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                        <h4 className="text-gray-400 text-sm font-medium">Batches</h4>
                        <p className="text-3xl font-bold">{uniqueBatches.length}</p>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                      <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                      {stats.recentActivity.length > 0 ? (
                        <ul className="divide-y divide-slate-700">
                          {stats.recentActivity.map((activity, index) => (
                            <li key={index} className="py-3 text-sm">
                              <p className="text-gray-300">
                                <span className="font-semibold text-blue-400">{activity.type.toUpperCase()}</span> record added. Details: <span className="font-semibold text-yellow-400">{activity.subject} - {activity.score}</span>.
                              </p>
                              <p className="text-xs text-gray-500">{new Date(activity.createdAt._seconds * 1000).toLocaleString()}</p>
                            </li>
                          ))}
                        </ul>
                      ) : <EmptyState message="No recent activity to show." />}
                    </div>
                  </div>
                )}

                {activeView === 'roster' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                      <h3 className="text-lg font-medium text-white">Student Roster</h3>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-auto bg-slate-700 border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className="w-full sm:w-auto bg-slate-700 border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                          <option value="">All Batches</option>
                          {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                    {filteredStudents.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                          <thead className="bg-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Batch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-slate-900/50 divide-y divide-slate-700">
                            {filteredStudents.map(s => (
                                <tr key={s.id} className="hover:bg-slate-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{s.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{s.batch}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 space-x-4">
                                        <button onClick={() => openEditModal(s)} className="text-blue-400 hover:text-blue-500 font-semibold">Edit</button>
                                        <button onClick={() => handleDeleteStudent(s.id, s.name)} className="text-red-400 hover:text-red-500 font-semibold">Delete</button>
                                    </td>
                                </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <EmptyState message="No students match the current filters." />}
                  </div>
                )}
                
                {activeView === 'addStudent' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">Add New Student</h3>
                    <form onSubmit={handleAddStudent} className="space-y-4">
                      <div><label className="block text-sm font-medium text-gray-300">Name</label><input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                      <div><label className="block text-sm font-medium text-gray-300">Email</label><input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                      <div><label className="block text-sm font-medium text-gray-300">Password</label><input type="password" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                      <div><label className="block text-sm font-medium text-gray-300">Batch (e.g., 10th A, 12th Science)</label><input type="text" value={studentBatch} onChange={(e) => setStudentBatch(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold">Add Student</button>
                    </form>
                  </div>
                )}

                {activeView === 'addMark' && (
                   <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">Add Student Mark</h3>
                    <form onSubmit={handleAddMark} className="space-y-4">
                       <div><label className="block text-sm font-medium text-gray-300">Select Student</label><select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"><option value="">-- Select a Student --</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-gray-300">Subject</label><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300">Score</label><input type="text" value={score} onChange={(e) => setScore(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold">Add Mark</button>
                    </form>
                  </div>
                )}

                {activeView === 'addCompletion' && (
                   <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">Chapter Completion Update</h3>
                    <form onSubmit={handleAddCompletion} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Update For:</label>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center"><input type="radio" value="student" checked={completionTarget === 'student'} onChange={() => setCompletionTarget('student')} className="form-radio h-4 w-4 text-blue-600 bg-slate-700 border-slate-600"/> <span className="ml-2">Specific Student</span></label>
                                <label className="flex items-center"><input type="radio" value="batch" checked={completionTarget === 'batch'} onChange={() => setCompletionTarget('batch')} className="form-radio h-4 w-4 text-blue-600 bg-slate-700 border-slate-600"/> <span className="ml-2">Entire Batch</span></label>
                            </div>
                        </div>
                        {completionTarget === 'student' ? (
                            <div><label className="block text-sm font-medium text-gray-300">Select Student</label><select value={completionStudent} onChange={(e) => setCompletionStudent(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"><option value="">-- Select a Student --</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        ) : (
                            <div><label className="block text-sm font-medium text-gray-300">Select Batch</label><select value={completionBatch} onChange={(e) => setCompletionBatch(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"><option value="">-- Select a Batch --</option>{uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                        )}
                        <div><label className="block text-sm font-medium text-gray-300">Subject</label><input type="text" value={completionSubject} onChange={(e) => setCompletionSubject(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300">Chapter Name</label><input type="text" value={chapterName} onChange={(e) => setChapterName(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300">Date</label><input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold">Mark as Completed</button>
                    </form>
                  </div>
                )}
                
                {activeView === 'sendFeedback' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium leading-6 text-white mb-4">Send Feedback / Note</h3>
                    <form onSubmit={handleSendFeedback} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Send To:</label>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center"><input type="radio" value="student" checked={feedbackTarget === 'student'} onChange={() => setFeedbackTarget('student')} className="form-radio h-4 w-4 text-blue-600 bg-slate-700 border-slate-600"/> <span className="ml-2">Specific Student</span></label>
                                <label className="flex items-center"><input type="radio" value="batch" checked={feedbackTarget === 'batch'} onChange={() => setFeedbackTarget('batch')} className="form-radio h-4 w-4 text-blue-600 bg-slate-700 border-slate-600"/> <span className="ml-2">Entire Batch</span></label>
                            </div>
                        </div>
                        {feedbackTarget === 'student' ? (
                            <div><label className="block text-sm font-medium text-gray-300">Select Student</label><select value={feedbackStudent} onChange={(e) => setFeedbackStudent(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"><option value="">-- Select a Student --</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        ) : (
                            <div><label className="block text-sm font-medium text-gray-300">Select Batch</label><select value={feedbackBatch} onChange={(e) => setFeedbackBatch(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"><option value="">-- Select a Batch --</option>{uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                        )}
                        <div><label className="block text-sm font-medium text-gray-300">Message (You can include a downloadable link here)</label><textarea value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} required rows="4" className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold">Send Message</button>
                    </form>
                  </div>
                )}

                {activeView === 'bulkAttendance' && (
                  <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-lg font-medium text-white mb-4">Bulk Attendance</h3>
                    <form onSubmit={handleBulkAttendanceSubmit}>
                      <div className="flex gap-4 mb-4">
                        <select value={bulkAttendanceBatch} onChange={e => setBulkAttendanceBatch(e.target.value)} required className="flex-grow bg-slate-700 border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                          <option value="">Select a Batch</option>
                          {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <input type="date" value={bulkAttendanceDate} onChange={e => setBulkAttendanceDate(e.target.value)} required className="bg-slate-700 border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                      </div>
                      {bulkAttendanceBatch && (
                        students.filter(s => s.batch === bulkAttendanceBatch).length > 0 ? (
                          <div className="space-y-4">
                            {students.filter(s => s.batch === bulkAttendanceBatch).map(s => (
                              <div key={s.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-md">
                                <p className="text-white">{s.name}</p>
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => handleBulkAttendanceChange(s.id, 'Present')} className={`px-3 py-1 text-sm rounded-md ${bulkAttendanceData[s.id] === 'Present' ? 'bg-green-500 text-white' : 'bg-slate-700'}`}>Present</button>
                                  <button type="button" onClick={() => handleBulkAttendanceChange(s.id, 'Absent')} className={`px-3 py-1 text-sm rounded-md ${bulkAttendanceData[s.id] === 'Absent' ? 'bg-red-500 text-white' : 'bg-slate-700'}`}>Absent</button>
                                </div>
                              </div>
                            ))}
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold">Submit Attendance</button>
                          </div>
                        ) : <EmptyState message="No students found in this batch." />
                      )}
                    </form>
                  </div>
                )}
                
                {activeView === 'settings' && (
                  <div className="space-y-8">
                    <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                      <h3 className="text-lg font-medium leading-6 text-white mb-4">Change Your Password</h3>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-300">New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300">Confirm New Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold">Update Password</button>
                      </form>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
                      <h3 className="text-lg font-medium leading-6 text-white mb-4">Manage Admins / Teachers</h3>
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-200 mb-2">Existing Admins</h4>
                        <ul className="divide-y divide-slate-700">
                          {admins.map(admin => (
                            <li key={admin.id} className="py-2 text-sm text-gray-300">{admin.name} ({admin.email})</li>
                          ))}
                        </ul>
                      </div>
                      <h4 className="text-md font-semibold text-gray-200 mb-2">Create New Admin</h4>
                      <form onSubmit={handleAddNewAdmin} className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-300">Name</label><input type="text" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300">Email</label><input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                        <div><label className="block text-sm font-medium text-gray-300">Password</label><input type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold">Create Admin</button>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Student">
        <form onSubmit={handleEditStudent} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-300">Name</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
          <div><label className="block text-sm font-medium text-gray-300">Batch</label><input type="text" value={editForm.batch} onChange={(e) => setEditForm({...editForm, batch: e.target.value})} required className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold">Save Changes</button>
        </form>
      </Modal>
    </div>
  );
}

export default AdminDashboard;
