import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Plus, Minus, Layers, Loader2, Car } from 'lucide-react';

// 🚀 V4 Tactical Marker (Radar Pulse Effect)
const heartbeatIcon = L.divIcon({
    className: 'heartbeat-marker animate-radar-pulse',
    iconSize: [12, 12]
});

// 🛸 HUD: V4 Minimalist Map Controls (Neutral Glass)
function MapHUD({ onRecenter, toggleHeatmap, heatmapActive, toggleTraffic, trafficActive }) {
    const map = useMap();

    const handleZoomIn = () => map.setZoom(map.getZoom() + 1);
    const handleZoomOut = () => map.setZoom(map.getZoom() - 1);

    return (
        <div className="absolute bottom-24 right-4 z-[999] flex flex-col space-y-3 translate-y-[-20px]">
            <div className="flex flex-col bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.4)]">
                <button onClick={handleZoomIn} className="p-3.5 text-white/40 hover:text-white hover:bg-slate-800 transition-all border-b border-white/5 active:bg-indigo-600"><Plus size={18} /></button>
                <button onClick={handleZoomOut} className="p-3.5 text-white/40 hover:text-white hover:bg-slate-800 transition-all active:bg-indigo-600"><Minus size={18} /></button>
            </div>

            <button
                onClick={onRecenter}
                className="p-3.5 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all shadow-2xl shadow-[0_0_30px_rgba(0,0,0,0.4)] group"
                title="Recenter Tracking"
            >
                <Crosshair size={20} className="group-active:rotate-90 transition-transform" />
            </button>

            <div className="relative group">
                <button
                    onClick={toggleHeatmap}
                    className={`p-3.5 backdrop-blur-xl rounded-2xl border shadow-2xl transition-all ${heatmapActive ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    title="Toggle Risk Intensity"
                >
                    <Layers size={20} />
                </button>
                {heatmapActive && (
                    <div className="absolute right-full mr-3 top-0 h-full flex items-center pointer-events-none">
                        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 whitespace-nowrap text-[10px] font-black text-indigo-400 uppercase tracking-widest shadow-2xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">Risk Intensity Logic Active</div>
                    </div>
                )}
            </div>

            <div className="relative group">
                <button
                    onClick={toggleTraffic}
                    className={`p-3.5 backdrop-blur-xl rounded-2xl border shadow-2xl transition-all ${trafficActive ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    title="Toggle Live Traffic"
                >
                    <Car size={20} />
                </button>
                {trafficActive && (
                    <div className="absolute right-full mr-3 top-0 h-full flex items-center pointer-events-none">
                        <div className="bg-emerald-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30 whitespace-nowrap text-[10px] font-black text-emerald-400 uppercase tracking-widest shadow-2xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">Live Traffic Active</div>
                    </div>
                )}
            </div>
        </div>
    );
}

// 🌑 V4 Tactical Focus Layer (Pure Visibility Refresh)
const MapEffects = ({ riskLevel }) => {
    return (
        <>
            {/* 📍 Minimal Focus Layer */}
            <div className={`absolute inset-0 pointer-events-none z-[800] transition-all duration-1000 ${riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'bg-[radial-gradient(circle,transparent_75%,rgba(244,63,94,0.15)_100%)]' : 'bg-[radial-gradient(circle,transparent_85%,rgba(15,23,42,0.1)_100%)]'}`}></div>

            {/* 🔴 Red Alert Pulse for High Risk */}
            {(riskLevel === 'CRITICAL' || riskLevel === 'HIGH') && (
                <div className="absolute inset-0 pointer-events-none z-[801] border-4 border-rose-500/20 animate-pulse rounded-[3rem]"></div>
            )}

            {/* 📍 Tactical Grid (Ultra Subtle 1% Opacity) */}
            <div className="absolute inset-0 pointer-events-none z-[801] opacity-[0.01] mix-blend-overlay" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}></div>
        </>
    );
};

export default function LiveRadar({ center = [17.3850, 78.4867], zoom = 12, title = "Situational Awareness", riskLevel = "LOW" }) {
    const [radarTimestamp, setRadarTimestamp] = useState(null);
    const [heatmapActive, setHeatmapActive] = useState(true);
    const [trafficActive, setTrafficActive] = useState(true);
    const [mapKey, setMapKey] = useState(0);

    const tomtomApiKey = import.meta.env.VITE_TOMTOM_API_KEY;

    const fetchRadarTS = useCallback(async () => {
        try {
            const response = await fetch('https://api.rainviewer.com/public/maps.json');
            const data = await response.json();
            if (data && data.length > 0) setRadarTimestamp(data[data.length - 1]);
        } catch (err) {
            console.error("[RadarAPI] Integration error:", err.message);
            setRadarTimestamp(Math.floor(Date.now() / 1000 / 600) * 600);
        }
    }, []);

    useEffect(() => {
        fetchRadarTS();
        const interval = setInterval(fetchRadarTS, 300000);
        return () => clearInterval(interval);
    }, [fetchRadarTS]);

    const handleRecenter = () => setMapKey(prev => prev + 1);

    const radarUrl = useMemo(() => radarTimestamp
        ? `https://tilecache.rainviewer.com/v2/radar/${radarTimestamp}/256/{z}/{x}/{y}/1/1_1.png`
        : null
        , [radarTimestamp]);

    return (
        <div className="w-full h-full relative group bg-slate-900 shadow-3xl overflow-hidden rounded-[3rem] border border-white/5 outline outline-offset-[-1px] outline-white/5">
            <MapEffects riskLevel={riskLevel} />

            <MapContainer
                key={mapKey}
                center={center}
                zoom={zoom}
                className="w-full h-full z-0 cursor-crosshair opacity-100"
                zoomControl={false}
                attributionControl={false}
                style={{
                    filter: riskLevel === 'CRITICAL'
                        ? 'brightness(0.9) contrast(1.4) saturate(1.5)'
                        : 'brightness(0.75) contrast(1.3) grayscale(0.4) saturate(0.8)'
                }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
                />

                {heatmapActive && radarUrl && (
                    <TileLayer
                        url={radarUrl}
                        opacity={riskLevel === 'CRITICAL' ? 0.5 : 0.3}
                        zIndex={100}
                    />
                )}

                {trafficActive && tomtomApiKey && (
                    <TileLayer
                        url={`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${tomtomApiKey}`}
                        opacity={0.8}
                        zIndex={101}
                    />
                )}

                <Marker position={center} icon={heartbeatIcon}>
                    <Popup>
                        <div className="p-4 text-slate-800 font-bold bg-white rounded-2xl shadow-3xl border border-slate-100 flex flex-col space-y-2">
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Active Partner Nexus</span>
                            <h4 className="text-xl font-black font-outfit italic">Tracking: Partner_01</h4>
                        </div>
                    </Popup>
                </Marker>

                <MapHUD
                    onRecenter={handleRecenter}
                    toggleHeatmap={() => setHeatmapActive(!heatmapActive)}
                    heatmapActive={heatmapActive}
                    toggleTraffic={() => setTrafficActive(!trafficActive)}
                    trafficActive={trafficActive}
                />
            </MapContainer>

            {/* 🔥 Status Header — Neutral Slate Redesign */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1001] px-7 py-3 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] flex items-center space-x-4 pointer-events-none group">
                <div className={`h-2.5 w-2.5 rounded-full transition-all duration-1000 ${riskLevel === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e] animate-pulse' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'}`}></div>
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.4em] italic leading-tight">{title}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">Situational Interface Protocol 4.2</span>
                </div>
            </div>
        </div>
    );
}
