import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiRequest } from '@/services/api'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// PROVIDER
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // ✅ true au démarrage

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest.get("/user/verify")
        setIsAuthenticated(true)
      } catch {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const login = async () => {
    setIsAuthenticated(true)
  }

  const logout = async () => {
    try {
      await apiRequest.post("/user/logout")
      setIsAuthenticated(false)
    } catch (err) {
      console.error("Erreur lors de la déconnexion", err)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// HOOK
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider')
  }
  return context
}