import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginatedData } from '@/hooks/usePaginatedData';
import { DataTableServer } from '@/components/dataTable/dataTableServer';
import { createColumnsExam, type Exam } from './columnsExam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExamFormDialog } from '@/components/admin/exam/examFormDialog';
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
  const [openEditExam, setOpenEditExam] = useState<Exam | null>(null);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [selectedRows, setSelectedRows] = useState<Exam[]>([]);
  const [filterMajor, setFilterMajor] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const { 
    data: exams, 
    pagination, 
    isLoading, 
    handlePageChange, 
    handlePageSizeChange, 
    handleSearchChange, 
    setData, 
    refetch 
  } = usePaginatedData<Exam>({
    endpoint: '/pastExam/list',
    initialPageSize: 20,
  });

  // Extract unique filter options from data
  const filterOptions = useMemo(() => {
    const allExams = exams;
    return {
      majors: [...new Set(allExams.map(e => e.major))].sort(),
      types: [...new Set(allExams.map(e => e.type))].sort(),
      levels: [...new Set(allExams.map(e => e.level))].sort(),
      years: [...new Set(allExams.map(e => e.year))].sort().reverse(),
    };
  }, [exams]);

  // Filter exams based on selected filters
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      if (filterMajor && exam.major !== filterMajor) return false;
      if (filterType && exam.type !== filterType) return false;
      if (filterLevel && exam.level !== filterLevel) return false;
      if (filterYear && exam.year !== parseInt(filterYear)) return false;
      return true;
    });
  }, [exams, filterMajor, filterType, filterLevel, filterYear]);

  const handleEdit = useCallback((exam: Exam) => {
    setOpenEditExam(exam);
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

  const exportToCSV = useCallback(() => {
    if (filteredExams.length === 0) {
      toast.error('Aucun examen à exporter');
      return;
    }

    const headers = ['Année', 'Spécialité', 'Niveau', 'Type', 'Cours', 'État', 'Annexes'];
    const rows = filteredExams.map(exam => [
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
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
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

    toast.success(`${filteredExams.length} examen${filteredExams.length > 1 ? 's' : ''} exported`);
  }, [filteredExams]);

  const columns = useMemo(
    () => createColumnsExam({ onDelete: handleDelete, onOpenDetails: handleOpenDetails }),
    [handleEdit, handleDelete]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Annales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredExams.length} examen{filteredExams.length !== 1 ? 's' : ''} 
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
            disabled={filteredExams.length === 0}
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
            data={filteredExams}
            pagination={pagination}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            onRowSelectionChange={setSelectedRows}
            searchKey="course"
            searchPlaceholder="Rechercher par cours ou type d'examen..."
          />
        </CardContent>
      </Card>

      <ExamFormDialog
        exam={openEditExam}
        open={!!openEditExam}
        onOpenChange={(open) => !open && setOpenEditExam(null)}
        onSaved={refetch}
      />

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
