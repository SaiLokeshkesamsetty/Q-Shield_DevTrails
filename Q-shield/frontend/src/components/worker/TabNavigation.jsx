import React from 'react';
import { LayoutGrid, CloudRain, Clock } from 'lucide-react';

const TABS = [
    { id: 'overview', icon: LayoutGrid, label: 'Overview' },
    { id: 'radar', icon: CloudRain, label: 'Live Radar' },
    { id: 'history', icon: Clock, label: 'History' }
];

export default function TabNavigation({ active, onChange }) {
    // Mapping active indices for the modern slider pill logic (33% width each for 3 tabs)
    const activeIndex = TABS.findIndex(t => t.id === active);
    
    return (
        <div 
            role="tablist" 
            className="flex glass bg-slate-100/50 p-1.5 rounded-2xl w-fit border border-white/40 shadow-inner mb-8 relative"
        >
            {/* 🛸 Dynamic CS-Powered Slider Pill */}
            <div 
                className="active-bg"
                style={{ 
                    left: `calc(6px + ${(activeIndex * 100) / TABS.length}%)`,
                    width: `calc(100% / ${TABS.length} - 12px)`,
                }}
            />
            
            <div className="flex relative z-10 w-full">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={active === tab.id}
                        tabIndex={active === tab.id ? 0 : -1}
                        onClick={() => onChange(tab.id)}
                        className={`relative flex items-center px-6 py-2.5 rounded-xl font-bold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                            active === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {active === tab.id && (
                           /* Inline indicator fallback if the main slider is too complex */
                           null 
                        )}
                        <tab.icon className={`w-4 h-4 mr-2 relative z-10 ${active === tab.id ? 'text-white' : ''}`} />
                        <span className="relative z-10 text-sm tracking-tight">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Custom Tailwind implementation for the active pill background */}
            <style dangerouslySetInnerHTML={{ __html: `
                button[aria-selected="true"] {
                    position: relative;
                }
                [role="tablist"] {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
                .active-bg {
                    position: absolute;
                    top: 6px;
                    bottom: 6px;
                    background: linear-gradient(to right, #4f46e5, #9333ea);
                    border-radius: 12px;
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 0;
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
                }
            `}} />
        </div>
    );
}
