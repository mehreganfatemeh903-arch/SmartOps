import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const hasToken = !!localStorage.getItem('smartops_token');

  if (!user && !hasToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
