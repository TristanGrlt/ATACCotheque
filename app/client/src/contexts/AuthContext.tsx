import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest, setUnauthorizedHandler } from '@/services/api'
import type { User } from "@/routes/admin/user/columnsUser";
import { PERMISSIONS } from '@/config/permissions'

// element type of PERMISSIONS object (e.g. 'MANAGE_USERS')
export type PermValue = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
// exported type requested by the user: list of permission values
export type perms = PermValue[]

/**
 * Extrait et normalise les permissions à partir des rôles d'un utilisateur
 * @param user - L'utilisateur avec ses rôles
 * @returns Un tableau unique de permissions valides
 */
const extractPermissions = (user: User | null): perms => {
  if (!user?.roles) return []
  
  const allPermissions = user.roles.flatMap(role => role.permissions || [])
  const uniquePermissions = Array.from(new Set(allPermissions))
  const validPermissions = uniquePermissions.filter(perm => 
    Object.values(PERMISSIONS).includes(perm)
  ) as perms
  
  return validPermissions
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials?: { username: string; password: string } | null) => Promise<{ requiresMfa: boolean; mfaMethod?: string }>
  refreshAuth: () => Promise<{ requiresOnboarding: boolean }>
  logout: () => Promise<void>
  forceLogout: () => void
  user: User | null
  perms: perms
  requiresOnboarding: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// PROVIDER
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser]= useState<User | null>(null)
  const [perms, setPerms] = useState<perms>([])
  const [requiresOnboarding, setRequiresOnboarding] = useState(false)
  const navigate = useNavigate()

  /**
   * Déconnexion forcée sans appel API
   * Utilisée par l'intercepteur Axios quand la session est expirée (401)
   */
  const forceLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    setPerms([])
  }

  useEffect(() => {
    // Configure l'intercepteur pour qu'il gère les 401 automatiquement
    setUnauthorizedHandler((currentPath: string) => {
      console.warn('Session expirée (401) - déconnexion automatique')
      forceLogout()
      // Redirige vers login en sauvegardant la page actuelle
      navigate('/login', { 
        state: { from: currentPath },
        replace: true 
      })
    })

    const checkAuth = async () => {
      try {
        const { data } = await apiRequest.get('/user/verify')
        
        if (data?.username) {
          setUser(data)
          setPerms(extractPermissions(data))
          setIsAuthenticated(true)
          setRequiresOnboarding(data.requiredOnboarding ?? false)
        }
      } catch (err) {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials?: { username: string; password: string } | null): Promise<{ requiresMfa: boolean; mfaMethod?: string }> => {
    try {
      const { data } = credentials 
        ? await apiRequest.post('/user/login', credentials)
        : await apiRequest.get('/user/verify')
      
      // Credentials valides mais MFA requis : ne pas encore authentifier
      if (data?.requiresMfa === true) {
        return { requiresMfa: true, mfaMethod: data.mfaMethod }
      }

      setUser(data)
      setPerms(extractPermissions(data))
      setIsAuthenticated(true)
      setRequiresOnboarding(data.requiredOnboarding ?? false)
      return { requiresMfa: false }
    } catch (err) {
      console.error('Erreur lors de la connexion', err)
      throw err
    }
  }

  /**
   * Rafraîchit l'état d'authentification depuis le serveur.
   * Utilisé après la validation MFA pour hydrater le contexte avec le session token.
   */
  const refreshAuth = async (): Promise<{ requiresOnboarding: boolean }> => {
    const { data } = await apiRequest.get('/user/verify')
    setUser(data)
    setPerms(extractPermissions(data))
    setIsAuthenticated(true)
    const needsOnboarding = data.requiredOnboarding ?? false
    setRequiresOnboarding(needsOnboarding)
    return { requiresOnboarding: needsOnboarding }
  }

  const logout = async () => {
    try {
      await apiRequest.post('/user/logout')
      setIsAuthenticated(false)
      setUser(null)
      setPerms([])
    } catch (err) {
      console.error('Erreur lors de la déconnexion', err)
      setIsAuthenticated(false)
      setUser(null)
      setPerms([])
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, refreshAuth, logout, forceLogout, user, perms, requiresOnboarding }}>
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