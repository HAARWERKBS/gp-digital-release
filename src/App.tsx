import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import StudentsPage from './pages/StudentsPage';
import { StoreProvider } from './lib/store';
import ProtectedRoute from './components/ProtectedRoute';
import LicenseRoute from './components/LicenseRoute';
import WelcomePage from './pages/WelcomePage';
import LicensePage from './pages/LicensePage';

// Pages
import GradingPage from './pages/GradingPage';
import SettingsPage from './pages/SettingsPage';
import GesellenbriefePage from './pages/GesellenbriefePage';

function App() {
    return (
        <StoreProvider>
            <HashRouter>
                <Routes>
                    {/* Lizenz-Eingabe (ohne Lizenz) */}
                    <Route path="/license" element={<LicensePage />} />

                    {/* Öffentliche Route: Willkommens-/Login-Seite (erfordert Lizenz) */}
                    <Route path="/welcome" element={
                        <LicenseRoute>
                            <WelcomePage />
                        </LicenseRoute>
                    } />

                    {/* Geschützte Routen: Erfordern Lizenz + Anmeldung */}
                    <Route
                        path="/"
                        element={
                            <LicenseRoute>
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            </LicenseRoute>
                        }
                    >
                        <Route index element={<StudentsPage />} />
                        <Route path="grading" element={<GradingPage />} />
                        <Route path="gesellenbriefe" element={<GesellenbriefePage />} />
                        {/* Einstellungen: Nur für Admins */}
                        <Route
                            path="settings"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <SettingsPage />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Fallback: Unbekannte Routen zur Startseite */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </HashRouter>
        </StoreProvider>
    );
}

export default App;
