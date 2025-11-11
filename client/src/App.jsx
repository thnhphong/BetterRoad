import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RoadMap from './pages/RoadMap';
import DamageList from './pages/DamageList';
import TaskManagement from './pages/TaskManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import WorkerList from "./pages/workers/WorkerList";
import WorkerDetail from "./pages/workers/WorkerDetail";
import WorkerRegister from "./pages/workers/WorkerRegister";


function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */} 
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes - Require Authentication */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/map" element={
          <ProtectedRoute>
            <RoadMap />
          </ProtectedRoute>
        } />

        <Route path="/damages" element={
          <ProtectedRoute>
            <DamageList />
          </ProtectedRoute>
        } />

        <Route path="/tasks" element={
          <ProtectedRoute>
            <TaskManagement />
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/workers" element={
        <ProtectedRoute>
          <WorkerList />
        </ProtectedRoute>
      } />

      <Route path="/workers/register" element={
        <ProtectedRoute>
          <WorkerRegister />
        </ProtectedRoute>
      } />

        <Route path="/workers/:id" element={
          <ProtectedRoute>
            <WorkerDetail />
          </ProtectedRoute>
        } />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;