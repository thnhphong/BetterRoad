import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  // TODO: Implement authentication check
  const isAuthenticated = false; // Placeholder

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;

