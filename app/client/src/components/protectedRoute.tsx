import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loading } from './loading'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Composant pour protéger les routes nécessitant une authentification
 * Redirige vers /login en sauvegardant la destination demandée
 */
export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    // Sauvegarde la localisation demandée pour rediriger après login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}