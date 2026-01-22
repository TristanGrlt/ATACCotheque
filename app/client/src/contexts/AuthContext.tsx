import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiRequest } from '@/services/api'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  username: string | null
  login: (credentials?: { username: string; password: string } | null) => Promise<void>
  logout: () => Promise<void>
  setUsername?: (name: string | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// PROVIDER
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await apiRequest.get('/user/verify')
        if (data?.username) {
          setUsername(data.username)
        }
        setIsAuthenticated(true)
      } catch (err) {
        setIsAuthenticated(false)
        setUsername(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials?: { username: string; password: string } | null) => {
    try {
      if (credentials) {
        const { data } = await apiRequest.post('/user/login', credentials)
        setUsername(data?.username ?? credentials.username ?? null)
      } else {
        const { data } = await apiRequest.get('/user/verify')
        setUsername(data?.username ?? null)
      }
      setIsAuthenticated(true)
    } catch (err) {
      console.error('Erreur lors de la connexion', err)
      throw err
    }
  }

  const logout = async () => {
    try {
      await apiRequest.post('/user/logout')
      setIsAuthenticated(false)
      setUsername(null)
    } catch (err) {
      console.error('Erreur lors de la déconnexion', err)
      setIsAuthenticated(false)
      setUsername(null)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, username, login, logout, setUsername }}>
      {children}
    </AuthContext.Provider>
  )
}

// HOOK
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider")
  }
  return context
}