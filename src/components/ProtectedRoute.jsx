import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, isConfigured } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // If Firebase not configured, allow through in demo mode
  if (!isConfigured) return children;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
