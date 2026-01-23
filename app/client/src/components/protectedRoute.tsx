import { Navigate, Outlet } from 'react-router-dom'
import { Loading } from './loading'
import { useAuth } from '@/contexts/AuthContext'

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()

  // const isLoading = true

  if (isLoading) {
    return (
      <Loading />
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}