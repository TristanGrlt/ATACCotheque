import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { PermValue } from '@/contexts/AuthContext'

interface PermissionRouteProps {
  requiredPermissions: PermValue[]
  requireAll?: boolean // true = toutes les permissions requises, false = au moins une
}

/**
 * Composant pour protéger les routes qui nécessitent des permissions spécifiques
 * Redirige vers /unauthorized si l'utilisateur n'a pas les permissions
 */
export const PermissionRoute = ({ 
  requiredPermissions, 
  requireAll = false 
}: PermissionRouteProps) => {
  const { perms } = useAuth()

  const hasPermission = requireAll
    ? requiredPermissions.every(permission => perms.includes(permission))
    : requiredPermissions.some(permission => perms.includes(permission))

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
