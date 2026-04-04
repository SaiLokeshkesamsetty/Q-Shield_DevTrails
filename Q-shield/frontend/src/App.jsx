import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/LandingPage';
import WorkerDashboard from './components/worker/WorkerDashboard';
import PolicyPage from './components/PolicyPage';
import ClaimsPage from './components/ClaimsPage';
import AdminDashboard from './components/AdminDashboard';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import { ShieldCheck, LogOut } from 'lucide-react';

function Navigation({ user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('qshield_user');
    setUser(null);
    navigate('/');
  };

  const NavLink = ({ to, children }) => (
    <Link 
        to={to} 
        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 relative ${
            isActive(to) 
            ? 'text-indigo-700 bg-indigo-50 shadow-sm after:content-[""] after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-0.5 after:bg-indigo-600 after:rounded-full' 
            : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100/50'
        }`}
    >
        {children}
    </Link>
  );

  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="sticky top-0 z-50 glass shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3 gap-2">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105 duration-300">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
            <Link to="/" className="font-outfit font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-purple-700 text-3xl tracking-tighter">Q-Shield</Link>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* 🕰️ LIVE SYNC CLOCK */}
            <div className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner group">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">System Live:</span>
                <span className="text-xs font-black font-mono text-slate-700">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            </div>

            <div className="hidden md:flex items-center">
              <div className="ml-10 flex items-baseline space-x-2 lg:space-x-4">
                 {!user ? (
                    <div className="flex space-x-3 items-center">
                      <Link to="/auth?mode=admin" className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors">Admin Login</Link>
                      <Link to="/auth?mode=login" className="px-5 py-2 text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors">Login</Link>
                      <Link to="/auth?mode=register" className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">Sign Up</Link>
                    </div>
                 ) : (
                   <>
                      {user.role === 'admin' ? (
                          <NavLink to="/admin">Admin Dashboard</NavLink>
                      ) : (
                          <>
                             <NavLink to="/dashboard">Dashboard</NavLink>
                             <NavLink to="/policy">Policy Hub</NavLink>
                             <NavLink to="/profile">Profile</NavLink>
                          </>
                      )}
                       <button onClick={handleLogout} className="flex items-center px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-full transition-all">
                          <LogOut className="w-4 h-4 mr-1"/> Logout
                       </button>
                   </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('qshield_user');
    return saved ? JSON.parse(saved) : null;
  });

  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans selection:bg-indigo-200 flex flex-col">
        <Toaster position="top-right" toastOptions={{ className: 'font-bold shadow-xl rounded-xl border border-gray-100', duration: 3000 }} />
        <Navigation user={user} setUser={setUser} />
        <main className="flex-grow w-full">
            <Routes>
              <Route path="/" element={<LandingPage user={user} />} />
              <Route path="/auth" element={<AuthPage setUser={setUser} user={user} />} />
              <Route path="/dashboard" element={<WorkerDashboard user={user} />} />
              <Route path="/policy" element={<PolicyPage user={user} />} />
              <Route path="/claims" element={<ClaimsPage user={user} />} />
              <Route path="/profile" element={<ProfilePage user={user} />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
