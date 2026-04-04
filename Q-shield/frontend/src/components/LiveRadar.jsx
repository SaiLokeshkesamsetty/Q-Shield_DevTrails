import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CloudRain, MapPin, Maximize2, Layers } from 'lucide-react';

// Fix Leaflet Marker Icon (Standard fix for React)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapResizer({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom || 11);
    }, [center, zoom, map]);
    return null;
}

export default function LiveRadar({ center = [17.3850, 78.4867], zoom = 11, title = "Live Doppler Radar", showLegend = true }) {
    const [radarTime, setRadarTime] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch latest RainViewer timestamp
        const fetchRadarTime = async () => {
            try {
                const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
                const data = await res.json();
                if (data.radar && data.radar.past.length > 0) {
                    // Latest is the last item in 'past'
                    const latest = data.radar.past[data.radar.past.length - 1];
                    setRadarTime(latest.time);
                }
            } catch (e) {
                console.error("RainViewer Fetch Failed:", e);
                // Fallback to static current if API fails (approximate)
                setRadarTime(Math.floor(Date.now() / 1000 / 600) * 600);
            } finally {
                setLoading(false);
            }
        };

        fetchRadarTime();
        const interval = setInterval(fetchRadarTime, 600000); // Update every 10 mins
        return () => clearInterval(interval);
    }, []);

    const radarUrl = radarTime 
        ? `https://tilecache.rainviewer.com/v2/radar/${radarTime}/256/{z}/{x}/{y}/4/1_1.png`
        : null;

    return (
        <div className="relative group rounded-3xl overflow-hidden border border-white/60 shadow-xl bg-white/40 backdrop-blur-md h-full min-h-[300px] transition-all hover:shadow-2xl hover:border-indigo-100 flex flex-col">
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/10 shadow-lg flex items-center space-x-2 pointer-events-auto transition-transform hover:scale-105">
                    <div className="relative">
                        <CloudRain className="w-4 h-4 text-sky-400" />
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping"></div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
                </div>
                {radarTime && (
                    <div className="bg-white/80 backdrop-blur-md text-slate-500 px-3 py-1 rounded-lg border border-white/40 shadow-sm flex items-center space-x-1.5 pointer-events-auto">
                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Live • {new Date(radarTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                )}
            </div>

            <div className="absolute bottom-4 right-4 z-[1000] pointer-events-auto flex space-x-2">
                <button title="Toggle Layers" className="p-2.5 bg-white rounded-xl shadow-lg border border-gray-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95">
                    <Layers className="w-4 h-4" />
                </button>
                <button title="Expand Map" className="p-2.5 bg-white rounded-xl shadow-lg border border-gray-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95">
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 w-full bg-slate-100 relative">
                {loading && (
                    <div className="absolute inset-0 z-[1001] bg-slate-50/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                            <span className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest">Calibrating Doppler...</span>
                        </div>
                    </div>
                )}
                
                <MapContainer center={center} zoom={zoom} zoomControl={false} scrollWheelZoom={true} className="h-full w-full grayscale-[20%] contrast-[110%] brightness-[95%]">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    
                    {radarUrl && (
                        <TileLayer
                            key={radarTime}
                            url={radarUrl}
                            opacity={0.7}
                            zIndex={100}
                        />
                    )}

                    <Marker position={center} zIndexOffset={500}>
                        {/* Custom pulsing marker if needed */}
                    </Marker>
                    
                    <MapResizer center={center} zoom={zoom} />
                </MapContainer>
            </div>

            {showLegend && (
                <div className="px-6 py-4 bg-white/40 border-t border-white/60 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                            <span className="text-[9px] font-black text-slate-500 uppercase">Light</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[9px] font-black text-slate-500 uppercase">Moderate</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                            <span className="text-[9px] font-black text-slate-500 uppercase">Heavy</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <span className="text-[9px] font-black text-slate-500 uppercase">Severe</span>
                        </div>
                    </div>
                    <div className="text-[9px] font-black text-slate-400 bg-slate-100/50 px-2 py-0.5 rounded uppercase tracking-tighter">
                        Updated every 10 min
                    </div>
                </div>
            )}
        </div>
    );
}
