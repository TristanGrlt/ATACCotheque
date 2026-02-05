// app/client/src/hooks/usePaginatedData.ts
import { useState, useEffect, useCallback } from "react"
import { apiRequest, getRequestMessage } from "@/services/api"
import { toast } from "sonner"
import type { PaginationState } from "@/components/dataTable/dataTableServer"

interface UsePaginatedDataOptions {
  endpoint: string
  initialPageSize?: number
  defaultSortBy?: string
  defaultSortOrder?: 'asc' | 'desc'
  onError?: (error: unknown) => void
}

interface UsePaginatedDataResult<T> {
  data: T[]
  pagination: PaginationState
  isLoading: boolean
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  setData: React.Dispatch<React.SetStateAction<T[]>>
  handlePageChange: (page: number) => void
  handlePageSizeChange: (pageSize: number) => void
  handleSearchChange: (search: string) => void
  handleSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  refetch: () => void
}

export function usePaginatedData<T>({
  endpoint,
  initialPageSize = 20,
  defaultSortBy = "id",
  defaultSortOrder = "desc",
  onError,
}: UsePaginatedDataOptions): UsePaginatedDataResult<T> {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })
  
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState(defaultSortBy)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder)

  // Fonction de chargement
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(search && { search }),
        sortBy,
        sortOrder,
      })

      const response = await apiRequest.get(`${endpoint}?${params}`)
      
      setData(response.data.data)
      setPagination(response.data.pagination)
    } catch (err) {
      const errorMessage = getRequestMessage(err)
      
      if (onError) {
        onError(err)
      } else {
        toast.error("Erreur lors du chargement des données", {
          description: errorMessage
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, pagination.page, pagination.pageSize, search, sortBy, sortOrder, onError])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handlers
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }, [])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }))
  }, [])

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }, [])

  return {
    data,
    pagination,
    isLoading,
    search,
    sortBy,
    sortOrder,
    setData,
    handlePageChange,
    handlePageSizeChange,
    handleSearchChange,
    handleSortChange,
    refetch: loadData,
  }
}