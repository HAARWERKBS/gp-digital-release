import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../lib/store';

interface LicenseRouteProps {
    children: React.ReactNode;
}

/**
 * Route-Guard der prüft ob eine gültige Lizenz vorhanden ist.
 * Wenn keine Lizenz vorhanden, wird zur Lizenz-Eingabeseite weitergeleitet.
 */
export default function LicenseRoute({ children }: LicenseRouteProps) {
    const { isLicensed } = useStore();

    if (!isLicensed) {
        return <Navigate to="/license" replace />;
    }

    return <>{children}</>;
}
