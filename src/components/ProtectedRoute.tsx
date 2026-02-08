import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { UserRole } from '../lib/types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: UserRole; // Optional: Nur bestimmte Rolle erlaubt
    redirectTo?: string; // Wohin bei fehlender Berechtigung
}

/**
 * Schützt Routen vor unautorisierten Zugriffen.
 *
 * Verwendung:
 * - Ohne requiredRole: Jeder eingeloggte Benutzer hat Zugriff
 * - Mit requiredRole="admin": Nur Admins haben Zugriff
 */
export default function ProtectedRoute({
    children,
    requiredRole,
    redirectTo = '/welcome'
}: ProtectedRouteProps) {
    const { authSession, isFirstTimeSetup } = useStore();

    // Ersteinrichtung - zur Welcome-Seite umleiten
    if (isFirstTimeSetup) {
        return <Navigate to="/welcome" replace />;
    }

    // Nicht eingeloggt - zur Welcome-Seite umleiten
    if (!authSession.isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    // Bestimmte Rolle erforderlich, aber nicht vorhanden
    if (requiredRole && authSession.role !== requiredRole) {
        // Mitarbeiter versucht Admin-Route -> zur Startseite
        return <Navigate to="/" replace />;
    }

    // Alles OK - Inhalt anzeigen
    return <>{children}</>;
}

/**
 * HOC für Komponenten die Admin-Rechte benötigen
 */
export function withAdminProtection<P extends object>(
    WrappedComponent: React.ComponentType<P>
): React.FC<P> {
    return function AdminProtectedComponent(props: P) {
        return (
            <ProtectedRoute requiredRole="admin">
                <WrappedComponent {...props} />
            </ProtectedRoute>
        );
    };
}
