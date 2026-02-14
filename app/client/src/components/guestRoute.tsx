import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loading } from './loading'

/**
 * Composant pour les routes accessibles uniquement aux utilisateurs NON connectés
 * Redirige vers la page demandée initialement (ou /admin) si déjà authentifié
 */
export const GuestRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <Loading />
  }

  if (isAuthenticated) {
    // Récupère la destination depuis le state ou redirige vers /admin par défaut
    const from = (location.state as { from?: string })?.from || '/admin'
    return <Navigate to={from} replace />
  }

  return <Outlet />
}
