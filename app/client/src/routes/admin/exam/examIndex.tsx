import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginatedData } from '@/hooks/usePaginatedData';
import { DataTableServer } from '@/components/dataTable/dataTableServer';
import { createColumnsExam, type Exam } from './columnsExam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmDialog } from '@/components/deleteConfirmDialog';
import { apiRequest, getRequestMessage } from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Trash2 } from 'lucide-react';

export function ExamIndex() {
  const navigate = useNavigate();
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [selectedRows, setSelectedRows] = useState<Exam[]>([]);
  const [filterMajor, setFilterMajor] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterOptions, setFilterOptions] = useState<{
    majors: string[];
    types: string[];
    levels: string[];
    years: number[];
  }>({
    majors: [],
    types: [],
    levels: [],
    years: [],
  });

  const activeFilters = useMemo(
    () => ({
      major: filterMajor,
      level: filterLevel,
      type: filterType,
      year: filterYear,
    }),
    [filterMajor, filterLevel, filterType, filterYear]
  );

  const { 
    data: exams, 
    pagination, 
    isLoading, 
    search,
    sortBy,
    sortOrder,
    handlePageChange, 
    handlePageSizeChange, 
    handleSearchChange, 
    handleSortChange,
    setData, 
    refetch 
  } = usePaginatedData<Exam>({
    endpoint: '/pastExam/list',
    initialPageSize: 20,
    filters: activeFilters,
  });

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [majorsRes, levelsRes, typesRes] = await Promise.all([
          apiRequest.get('/major'),
          apiRequest.get('/level'),
          apiRequest.get('/examType'),
        ]);

        const majors: string[] = (majorsRes.data ?? [])
          .map((item: { name?: string }) => item.name)
          .filter((name: string | undefined): name is string => Boolean(name))
          .sort((a: string, b: string) => a.localeCompare(b));

        const levels: string[] = (levelsRes.data ?? [])
          .map((item: { name?: string }) => item.name)
          .filter((name: string | undefined): name is string => Boolean(name))
          .sort((a: string, b: string) => a.localeCompare(b));

        const types: string[] = (typesRes.data ?? [])
          .map((item: { name?: string }) => item.name)
          .filter((name: string | undefined): name is string => Boolean(name))
          .sort((a: string, b: string) => a.localeCompare(b));

        const yearsSet = new Set<number>();
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
          const params = new URLSearchParams({
            page: String(page),
            pageSize: '200',
            sortBy: 'year',
            sortOrder: 'desc',
          });

          const response = await apiRequest.get(`/pastExam/list?${params.toString()}`);
          const pageData = response.data?.data ?? [];
          const pagePagination = response.data?.pagination;

          pageData.forEach((exam: Exam) => yearsSet.add(exam.year));

          hasNextPage = Boolean(pagePagination?.hasNextPage);
          page += 1;
        }

        setFilterOptions({
          majors,
          levels,
          types,
          years: [...yearsSet].sort((a, b) => b - a),
        });
      } catch (err) {
        toast.error(`Erreur chargement des filtres: ${getRequestMessage(err)}`);
      }
    };

    loadFilterOptions();
  }, []);

  const handleDelete = useCallback((exam: Exam) => {
    setExamToDelete(exam);
  }, []);

  const handleOpenDetails = useCallback((exam: Exam) => {
    navigate(`/admin/manageExam?id=${exam.id}`);
  }, [navigate]);

  const confirmDelete = useCallback(async () => {
    if (examToDelete) {
      try {
        await apiRequest.delete(`/pastExam/${examToDelete.id}`);
        setData(prev => prev.filter(e => e.id !== examToDelete.id));
        setExamToDelete(null);
        toast.success('Examen supprimé avec succès');
        refetch();
      } catch (err) {
        toast.error(`Erreur: ${getRequestMessage(err)}`);
      }
    }
  }, [examToDelete, setData, refetch]);

  const confirmBulkDelete = useCallback(async () => {
    if (selectedRows.length === 0) {
      toast.error('Sélectionnez au moins un examen');
      return;
    }

    try {
      const results = await Promise.allSettled(
        selectedRows.map(exam => apiRequest.delete(`/pastExam/${exam.id}`))
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      setData(prev => prev.filter(e => !selectedRows.find(sr => sr.id === e.id)));
      setSelectedRows([]);
      
      if (failed === 0) {
        toast.success(`${succeeded} examen${succeeded > 1 ? 's' : ''} supprimé${succeeded > 1 ? 's' : ''}`);
      } else {
        toast.warning(`${succeeded} supprimé, ${failed} erreur${failed > 1 ? 's' : ''}`);
      }
      
      refetch();
    } catch (err) {
      toast.error(`Erreur: ${getRequestMessage(err)}`);
    }
  }, [selectedRows, setData, refetch]);

  const exportToCSV = useCallback(async () => {
    try {
      const allExams: Exam[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: '200',
          sortBy,
          sortOrder,
          ...(search ? { search } : {}),
          ...(filterMajor ? { major: filterMajor } : {}),
          ...(filterLevel ? { level: filterLevel } : {}),
          ...(filterType ? { type: filterType } : {}),
          ...(filterYear ? { year: filterYear } : {}),
        });

        const response = await apiRequest.get(`/pastExam/list?${params.toString()}`);
        const pageData: Exam[] = response.data?.data ?? [];
        const pagePagination = response.data?.pagination;

        allExams.push(...pageData);
        hasNextPage = Boolean(pagePagination?.hasNextPage);
        page += 1;
      }

      if (allExams.length === 0) {
        toast.error('Aucun examen à exporter');
        return;
      }

      const headers = ['Année', 'Spécialité', 'Niveau', 'Type', 'Cours', 'État', 'Annexes'];
      const escapeCsvCell = (value: string | number | boolean) => `"${String(value).replace(/"/g, '""')}"`;
      const rows = allExams.map(exam => [
        exam.year,
        exam.major,
        exam.level,
        exam.type,
        exam.course,
        exam.isVerified ? 'Vérifié' : 'En attente',
        exam.annexeCount,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => escapeCsvCell(cell)).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `annales-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${allExams.length} examen${allExams.length > 1 ? 's' : ''} exporté${allExams.length > 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(`Erreur export CSV: ${getRequestMessage(err)}`);
    }
  }, [search, sortBy, sortOrder, filterMajor, filterLevel, filterType, filterYear]);

  const columns = useMemo(
    () => createColumnsExam({ onDelete: handleDelete, onOpenDetails: handleOpenDetails }),
    [handleDelete, handleOpenDetails]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Annales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination.totalCount} examen{pagination.totalCount !== 1 ? 's' : ''} 
            {selectedRows.length > 0 && ` • ${selectedRows.length} sélectionné${selectedRows.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {selectedRows.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer ({selectedRows.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={pagination.totalCount === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filterYear || 'all'} onValueChange={(val) => setFilterYear(val === 'all' ? '' : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les années" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {filterOptions.years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMajor || 'all'} onValueChange={(val) => setFilterMajor(val === 'all' ? '' : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les spécialités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les spécialités</SelectItem>
                {filterOptions.majors.map(major => (
                  <SelectItem key={major} value={major}>
                    {major}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterLevel || 'all'} onValueChange={(val) => setFilterLevel(val === 'all' ? '' : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {filterOptions.levels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType || 'all'} onValueChange={(val) => setFilterType(val === 'all' ? '' : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {filterOptions.types.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(filterYear || filterMajor || filterLevel || filterType) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterYear('');
                setFilterMajor('');
                setFilterLevel('');
                setFilterType('');
              }}
              className="mt-3"
            >
              Réinitialiser les filtres
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card>
        <CardContent className="pt-6">
          <DataTableServer
            columns={columns}
            data={exams}
            pagination={pagination}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            onRowSelectionChange={setSelectedRows}
            searchKey="course"
            searchPlaceholder="Rechercher par cours ou type d'examen..."
          />
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={!!examToDelete}
        onOpenChange={(open) => !open && setExamToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer cet examen ?"
        description="Cette action est irréversible."
        itemName={`${examToDelete?.course} (${examToDelete?.year})`}
      />
    </div>
  );
}
