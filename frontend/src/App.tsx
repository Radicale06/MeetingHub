import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { AuthLogin } from './pages/AuthLogin';
import { AuthSignup } from './pages/AuthSignup';
import { AuthForgotPassword } from './pages/AuthForgotPassword';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { MeetingsList } from './pages/MeetingsList';
import { RecordingsList } from './pages/RecordingsList';
import { ContactsList } from './pages/ContactsList';
import Settings from './pages/Settings';
import { ActiveMeeting } from './pages/ActiveMeeting';

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthLogin />} />
        <Route path="/signup" element={<AuthSignup />} />
        <Route path="/forgot-password" element={<AuthForgotPassword />} />

        {/* Authenticated Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          {/* Add more sidebar routes here as needed */}
          <Route path="/meetings" element={<MeetingsList />} />
          <Route path="/recordings" element={<RecordingsList />} />
          <Route path="/contacts" element={<ContactsList />} />
        </Route>

        {/* Fullscreen Meeting Route */}
        <Route path="/meeting/:id" element={<ActiveMeeting />} />
        <Route path="/meeting" element={<ActiveMeeting />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
