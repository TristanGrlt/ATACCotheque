import { apiRequest } from '@/services/api'
import { useState, useEffect } from 'react'

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifyToken = async () => {
      setIsLoading(true)

      const response = await apiRequest.get("/user/verify")

      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }

      setIsLoading(false)
    }

    verifyToken()
  }, [])

  return { isAuthenticated, isLoading }
}