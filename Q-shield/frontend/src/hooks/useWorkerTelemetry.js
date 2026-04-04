import { useState, useEffect, useCallback } from 'react';
import { fetchDashboard } from '../api';

export const useWorkerTelemetry = (workerId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        if (!workerId) return;
        try {
            const dashboardData = await fetchDashboard(workerId);
            // 📡 Environmental Safety Bridge (Elite Defaults)
            const safeData = {
                aqi: 42,
                rainfall: 0,
                temperature: 32,
                zone: 'Nexus Zone',
                ...dashboardData
            };
            setData(safeData);
            setError(null);
        } catch (e) {
            console.error('[Telemetry] Fetch error:', e);
            setError('Failed to sync with AI sensors');
        } finally {
            setLoading(false);
        }
    }, [workerId]);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 3000);
        return () => clearInterval(interval);
    }, [loadData]);

    return { data, loading, error, refresh: loadData };
};
