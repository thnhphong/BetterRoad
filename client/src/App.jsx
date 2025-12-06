import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Main pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DamageList from './pages/DamageList';
import RoadMap from './pages/RoadMap';
import TaskManagement from './pages/TaskManagement';
import Report from './pages/Reports';
import Settings from './pages/Settings';

// Worker pages
import WorkerList from './pages/workers/WorkerList';
import WorkerDetail from './pages/workers/WorkerDetail';
import WorkerEdit from './pages/workers/WorkerEdit';
import WorkerRegister from './pages/workers/WorkerRegister';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes - Chỉ authenticated users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/damages"
          element={
            <ProtectedRoute>
              <DamageList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <RoadMap />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <TaskManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Worker Routes - Chỉ Admin và Supervisor */}
        <Route
          path="/workers"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <WorkerList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workers/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <WorkerDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workers/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <WorkerEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workers/register"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <WorkerRegister />
            </ProtectedRoute>
          }
        />

        {/* 404 - Not Found */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Trang không tồn tại</p>
                <a
                  href="/"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Về trang chủ
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;