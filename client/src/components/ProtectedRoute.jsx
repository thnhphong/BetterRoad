import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if token expired (optional)
  try {
    const session = JSON.parse(localStorage.getItem('supabase_session'));
    const expiresAt = session?.expires_at;
    
    if (expiresAt && Date.now() / 1000 > expiresAt) {
      // Token expired
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }
  } catch (err) {
    console.error('Session check error:', err);
  }
  
  return children;
};

export default ProtectedRoute;