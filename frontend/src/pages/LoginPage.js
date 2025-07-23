import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Trigger animations on component mount
    setIsMounted(true);
  }, []);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const response = await axios.post('http://localhost:5000/api/get-session-data', { idToken });
      const { user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'student') {
        navigate('/student/dashboard');
      } else if (user.role === 'parent') {
        navigate('/parent/dashboard');
      } else {
        setError('Unknown user role.');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error("Firebase Auth Error:", err.code, err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const noiseBg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")";

  return (
    <div 
      className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4"
      style={{ 
        backgroundImage: `${noiseBg}, 
                          radial-gradient(at 80% 20%, hsla(212,80%,40%,0.3) 0px, transparent 50%),
                          radial-gradient(at 20% 90%, hsla(280,70%,40%,0.3) 0px, transparent 50%),
                          radial-gradient(at 50% 50%, hsla(260,70%,20%,0.2) 0px, transparent 50%)`
      }}
    >
      <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-2xl rounded-xl p-8 max-w-sm w-full transition-all duration-1000 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <img 
          src="/images/Adobe Express - file 1.png" 
          alt="BASE Logo" 
          className={`w-48 h-auto mx-auto mb-4 transition-all duration-1000 ease-out ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        />
        <p className={`text-center text-gray-400 mb-6 transition-all duration-1000 ease-out animate-delay-200 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>Student & Parent Portal</p>
        <form onSubmit={handleLogin}>
          <div className={`mb-4 transition-all duration-1000 ease-out animate-delay-300 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              required
            />
          </div>
          <div className={`mb-6 transition-all duration-1000 ease-out animate-delay-400 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded w-full py-2 px-3 text-gray-200 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              required
            />
          </div>
          <div className={`flex items-center justify-between transition-all duration-1000 ease-out animate-delay-500 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Sign In'}
            </button>
          </div>
        </form>
        {error && <p className="text-red-400 text-xs italic mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}

export default LoginPage;
