import { API_ENDPOINT } from '@/config/env';
import axios from 'axios'

export const apiRequest = axios.create({
  baseURL: API_ENDPOINT,
  withCredentials: true
});

/**
 * Callback pour gérer les erreurs 401 (session expirée)
 * Configuré automatiquement par AuthProvider au démarrage de l'application
 */
let unauthorizedHandler: ((currentPath: string) => void) | null = null

export const setUnauthorizedHandler = (handler: (currentPath: string) => void) => {
  unauthorizedHandler = handler
}

// Intercepteur de réponse pour gérer les erreurs d'authentification
apiRequest.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si erreur 401 et qu'un handler est configuré
    if (error.response?.status === 401 && unauthorizedHandler) {
      // Ne pas déclencher sur les endpoints de login/verify
      const isAuthEndpoint = error.config?.url?.includes('/login') || 
                            error.config?.url?.includes('/verify')
      
      if (!isAuthEndpoint) {
        // Récupère le chemin actuel pour redirection après re-connexion
        const currentPath = window.location.pathname
        unauthorizedHandler(currentPath)
      }
    }
    
    return Promise.reject(error)
  }
)

export const getRequestMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    return data?.error ?? err.message;
  } else {
    return err instanceof Error ? err.message : String(err);
  }
};