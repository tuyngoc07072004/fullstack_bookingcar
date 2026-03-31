import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, currentStaff, isAuthenticated } = useAppSelector((state) => state.staff);
  const location = useLocation();

  if (!token || !isAuthenticated) {
    return <Navigate to="/staff-login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}