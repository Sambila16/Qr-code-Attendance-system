import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Overview from './pages/cr/Overview';
import Sessions from './pages/cr/Sessions';
import SessionRoom from './pages/cr/SessionRoom';
import Review from './pages/cr/Review';
import Students from './pages/cr/Students';

import StudentHome from './pages/student/Home';
import ScanAttendance from './pages/student/ScanAttendance';
import History from './pages/student/History';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === 'student' ? '/student' : '/cr'} replace /> : <Login />}
      />

      <Route
        path="/cr"
        element={
          <ProtectedRoute roles={['cr', 'admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="sessions/:id" element={<SessionRoom />} />
        <Route path="review" element={<Review />} />
        <Route path="students" element={<Students />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['student']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="scan" element={<ScanAttendance />} />
        <Route path="history" element={<History />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? (user.role === 'student' ? '/student' : '/cr') : '/login'} replace />} />
    </Routes>
  );
}
