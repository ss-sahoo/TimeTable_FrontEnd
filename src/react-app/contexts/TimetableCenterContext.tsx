import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthContext } from './AuthContext';
import { api } from '@/react-app/hooks/useApi';

interface Center {
    id: string;
    name: string;
}

interface TimetableCenterContextType {
    selectedCenterId: string | null;
    selectedCenterName: string | null;
    setSelectedCenter: (id: string | null, name: string | null) => void;
    centers: Center[];
    loading: boolean;
    error: string | null;
    refreshCenters: () => Promise<void>;
}

const TimetableCenterContext = createContext<TimetableCenterContextType | undefined>(undefined);

export const TimetableCenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuthContext();
    const [selectedCenterId, setSelectedCenterId] = useState<string | null>(localStorage.getItem('timetable_selected_center_id'));
    const [selectedCenterName, setSelectedCenterName] = useState<string | null>(localStorage.getItem('timetable_selected_center_name'));
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshCenters = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            // Use the correct API endpoint and extract results
            const response = await api.get('/timetable/centers/');
            const centersData = response.data.results || response.data || [];
            setCenters(Array.isArray(centersData) ? centersData : []);
        } catch (err: any) {
            console.error('Failed to fetch centers:', err);
            setError('Failed to load centers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            refreshCenters();

            // If user is not Super Admin, they have an assigned center
            if (user.role?.toUpperCase() !== 'SUPER_ADMIN') {
                const centerId = user.center_id || (user as any).center?.id;
                const centerName = user.center_name || (user as any).center?.name;

                if (centerId) {
                    setSelectedCenterId(centerId.toString());
                    setSelectedCenterName(centerName || 'Assigned Center');
                }
            }
        }
    }, [user]);

    const setSelectedCenter = (id: string | null, name: string | null) => {
        setSelectedCenterId(id);
        setSelectedCenterName(name);
        if (id) {
            localStorage.setItem('timetable_selected_center_id', id);
        } else {
            localStorage.removeItem('timetable_selected_center_id');
        }
        if (name) {
            localStorage.setItem('timetable_selected_center_name', name);
        } else {
            localStorage.removeItem('timetable_selected_center_name');
        }
    };

    return (
        <TimetableCenterContext.Provider
            value={{
                selectedCenterId,
                selectedCenterName,
                setSelectedCenter,
                centers,
                loading,
                error,
                refreshCenters
            }}
        >
            {children}
        </TimetableCenterContext.Provider>
    );
};

export const useTimetableCenter = () => {
    const context = useContext(TimetableCenterContext);
    if (context === undefined) {
        throw new Error('useTimetableCenter must be used within a TimetableCenterProvider');
    }
    return context;
};
