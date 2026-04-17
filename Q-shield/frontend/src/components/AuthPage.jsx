import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Key, MapPin, Zap, ShieldCheck, Mail, Smartphone, Loader2, X, Search, Navigation as NavIcon, CheckCircle2 } from 'lucide-react';
import { loginWorker, registerWorker, loginAdmin } from '../api';
import toast from 'react-hot-toast';

// Leaflet Imports
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Marker Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.setView(position, 15);
    }, [position, map]);
    return null;
}

function LocationPickerModal({ isOpen, onClose, onSelect }) {
    const [tempPos, setTempPos] = useState([17.3850, 78.4867]); // Default Hyderabad
    const [finding, setFinding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                setTempPos([e.latlng.lat, e.latlng.lng]);
            },
        });
        return null;
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        console.log("📍 [AuthPage] Requesting live location...");
        setFinding(true);
        
        const ipFallback = async () => {
            console.log("🌐 [AuthPage] GPS failed. Trying IP-based fallback...");
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.latitude && data.longitude) {
                    const newPos = [data.latitude, data.longitude];
                    setTempPos(newPos);
                    toast.success(`Found by IP: ${data.city || 'Approx. Location'}`);
                } else {
                    toast.error("Couldn't find location. Please use Search.");
                }
            } catch (err) {
                toast.error("Location services unavailable. Please use Search.");
            } finally {
                setFinding(false);
            }
        };

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = [pos.coords.latitude, pos.coords.longitude];
                console.log("✅ [AuthPage] GPS Location found:", newPos);
                setTempPos(newPos);
                setFinding(false);
                toast.success("GPS Location updated!");
            },
            (err) => {
                console.warn("⚠️ [AuthPage] GPS Error:", err.message);
                ipFallback(); // Fall back to IP if GPS fails
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const newPos = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                setTempPos(newPos);
                toast.success(`Found: ${data[0].display_name.split(',')[0]}`, { duration: 2000 });
            } else {
                toast.error("Location not found.");
            }
        } catch (err) {
            toast.error("Search service unavailable.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleConfirm = async () => {
        setIsSearching(true);
        try {
            // Real Reverse Geocoding via Nominatim
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempPos[0]}&lon=${tempPos[1]}`);
            const data = await res.json();
            
            // Extract a neat address (Suburb/City or similar)
            const addr = data.address;
            const zoneName = addr.suburb || addr.city_district || addr.city || addr.town || addr.village || "Selected Area";
            const displayZone = `${zoneName}, ${addr.state || ''}`.replace(/, $/, "");

            onSelect({
                zone: displayZone,
                latitude: tempPos[0],
                longitude: tempPos[1]
            });
            onClose();
        } catch (err) {
            console.error("Reverse Geocode failed", err);
            onSelect("Custom Area");
            onClose();
        } finally {
            setIsSearching(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 font-outfit">Select Work Area</h3>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Tap the map to set your coverage zone</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400"/></button>
                </div>
                
                <div className="h-[400px] relative">
                    {/* Search Bar Overlay */}
                    <form onSubmit={handleSearch} className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for a city or area..." 
                                className="w-full pl-10 pr-4 py-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium text-sm transition-all"
                            />
                        </div>
                        <button disabled={isSearching} className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-indigo-700 transition-all font-bold text-sm flex items-center">
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                        </button>
                    </form>

                    <MapContainer center={tempPos} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={tempPos} />
                        <MapEvents />
                        <RecenterMap position={tempPos} />
                    </MapContainer>
                    
                    <button 
                        onClick={handleLocateMe}
                        className="absolute bottom-6 right-6 z-[1000] bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center group font-bold text-sm"
                    >
                        <NavIcon className={`w-5 h-5 mr-0 group-hover:mr-2 transition-all ${finding ? 'animate-spin' : ''}`} />
                        <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-500 whitespace-nowrap">Locate Me</span>
                    </button>
                </div>

                <div className="p-6 bg-gray-50 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-all">Cancel</button>
                    <button onClick={handleConfirm} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">Confirm Selected Area</button>
                </div>
            </div>
        </div>
    );
}

export default function AuthPage({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState('worker-login');
  const [formData, setFormData] = useState({ 
    name: '', email: '', platform: '', zone: '', 
    username: '', password: '', latitude: null, longitude: null 
  });
  const [loading, setLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
     const params = new URLSearchParams(location.search);
     const mode = params.get('mode');
     if (mode === 'register') setAuthMode('worker-register');
     else if (mode === 'admin') setAuthMode('admin-login');
     else setAuthMode('worker-login');
  }, [location]);

  useEffect(() => {
    if (user) {
      if(user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAuth = async (e) => {
    e.preventDefault();
    
    // Quick validation first
    if(authMode === 'worker-register') {
      if(!formData.name || !formData.email || !formData.password || !formData.platform || !formData.zone) {
          return toast.error('Please fill in all registration fields');
      }
    } else if(authMode === 'worker-login' && (!formData.email || !formData.password)) {
      return toast.error('Email and Password are required');
    }

    setIsMapOpen(false); // 🏗️ Safety: Force-close the map before auth starts
    setLoading(true);
    
    setTimeout(async () => {
        try {
            if(authMode === 'admin-login') {
                const res = await loginAdmin(formData.username, formData.password);
                if(res.success) {
                    const adminData = { role: 'admin', name: 'System Admin' };
                    localStorage.setItem('qshield_user', JSON.stringify(adminData));
                    setUser(adminData);
                    toast.success('Admin access granted');
                } else toast.error('Invalid admin credentials');
                
            } else if(authMode === 'worker-login') {
                const res = await loginWorker(formData.email, formData.password);
                if(res.success) {
                    const userData = { ...res.worker, name: res.worker.full_name || res.worker.name, role: 'worker' };
                    localStorage.setItem('qshield_user', JSON.stringify(userData));
                    setUser(userData);
                    toast.success(`Welcome back, ${userData.name}!`);
                } else toast.error('Invalid Email or Password. Please try again.');
                
            } else if(authMode === 'worker-register') {
                const res = await registerWorker({ 
                    name: formData.name, 
                    email: formData.email, 
                    platform: formData.platform, 
                    zone: formData.zone, 
                    password: formData.password,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                });
                
                if(res.success) {
                    const userData = { ...res.worker, name: res.worker.full_name || res.worker.name, role: 'worker' };
                    localStorage.setItem('qshield_user', JSON.stringify(userData));
                    setUser(userData);
                    toast.success('Registration successful!');
                } else {
                    toast.error(res.error || 'Registration failed');
                }
            }
        } catch(err) {
            toast.error('Network error during authentication.');
        } finally {
            setLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="w-full max-w-md relative">
          <div className="bg-white p-8 rounded-3xl relative overflow-hidden border border-gray-100 shadow-[0_20px_50px_rgba(99,102,241,0.1)]">
              
              <div className="text-center mb-8">
                  <ShieldCheck className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
                  <h1 className="text-2xl font-black font-outfit text-gray-900">
                      {authMode === 'worker-login' ? 'Welcome Back' : authMode === 'worker-register' ? 'Join Q-Shield' : 'Command Center'}
                  </h1>
                  <p className="text-gray-500 font-medium mt-1 text-sm">
                      {authMode === 'worker-login' ? 'Login to manage your parametric coverage.' : authMode === 'worker-register' ? 'Register to protect your gig earnings instantly.' : 'Enter administrator credentials.'}
                  </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'admin-login' && (
                      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Admin Username</label>
                              <div className="relative group">
                                  <User className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors"/>
                                  <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium text-gray-800 bg-white" placeholder="Enter 'admin'"/>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Secure Password</label>
                              <div className="relative group">
                                  <Key className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors"/>
                                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium text-gray-800 bg-white" placeholder="Enter '2005'"/>
                              </div>
                          </div>
                          <button type="submit" disabled={loading} className="w-full relative group overflow-hidden bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(147,51,234,0.5)] transition-all mt-6 hover:-translate-y-0.5 disabled:opacity-70 flex justify-center items-center">
                              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Access Admin Dashboard'}
                          </button>
                          <div className="text-center mt-6">
                              <button type="button" onClick={() => setAuthMode('worker-login')} className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors pt-4">Return to Partner Login</button>
                          </div>
                      </div>
                  )}

                  {authMode === 'worker-login' && (
                      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                              <div className="relative group">
                                  <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-gray-800 bg-white" placeholder="e.g. rahul@gmail.com"/>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                              <div className="relative group">
                                  <Key className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-gray-800 bg-white" placeholder="Enter password"/>
                              </div>
                          </div>
                          <button type="submit" disabled={loading} className="w-full relative group overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] transition-all mt-6 hover:-translate-y-0.5 disabled:opacity-70 flex justify-center items-center">
                              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
                          </button>
                          
                          <div className="text-center pt-5 border-t border-gray-100 mt-6">
                              <span className="text-sm font-medium text-gray-500">Don't have an account? </span>
                              <button type="button" onClick={() => setAuthMode('worker-register')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Sign up here</button>
                          </div>
                      </div>
                  )}

                  {authMode === 'worker-register' && (
                      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                              <div className="relative group">
                                  <User className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-gray-800 bg-white" placeholder="e.g. Rahul"/>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                              <div className="relative group">
                                  <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-gray-800 bg-white" placeholder="e.g. rahul@gmail.com"/>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                              <div className="relative group">
                                  <Key className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-gray-800 bg-white" placeholder="Create a password"/>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Gig App</label>
                                  <div className="relative group">
                                      <Smartphone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                                      <input type="text" name="platform" value={formData.platform} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-gray-800 bg-white" placeholder="Blinkit, Swiggy.."/>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Locate me</label>
                                  <button 
                                      type="button" 
                                      onClick={() => setIsMapOpen(true)}
                                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-indigo-500 hover:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-left bg-white relative text-gray-800 flex items-center shadow-sm"
                                  >
                                      <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-indigo-500 transition-colors z-10"/>
                                      {formData.zone || "Tap to Select..."}
                                      {formData.zone && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                                  </button>
                              </div>
                          </div>

                          <LocationPickerModal 
                              isOpen={isMapOpen} 
                              onClose={() => setIsMapOpen(false)} 
                              onSelect={(locData) => setFormData({ 
                                  ...formData, 
                                  zone: locData.zone, 
                                  latitude: locData.latitude, 
                                  longitude: locData.longitude 
                              })} 
                          />
                          <button type="submit" disabled={loading} className="w-full relative group overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] transition-all mt-6 hover:-translate-y-0.5 disabled:opacity-70 flex justify-center items-center">
                              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                          </button>

                          <div className="text-center pt-5 border-t border-gray-100 mt-6">
                              <span className="text-sm font-medium text-gray-500">Already registered? </span>
                              <button type="button" onClick={() => setAuthMode('worker-login')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Login to your account</button>
                          </div>
                      </div>
                  )}
              </form>
          </div>
      </div>
    </div>
  );
}
