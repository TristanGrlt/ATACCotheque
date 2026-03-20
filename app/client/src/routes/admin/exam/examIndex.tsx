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

export function ExamIndex() {
  const navigate = useNavigate();
  const [openEditExam, setOpenEditExam] = useState<Exam | null>(null);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  const { data: exams, pagination, isLoading, handlePageChange, handlePageSizeChange, handleSearchChange, setData, refetch } = usePaginatedData<Exam>({
    endpoint: '/pastExam/list',
    initialPageSize: 20,
  });

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

  const columns = useMemo(
    () => createColumnsExam({ onEdit: handleEdit, onDelete: handleDelete, onOpenDetails: handleOpenDetails }),
    [handleEdit, handleDelete]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Annales</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableServer
            columns={columns}
            data={exams}
            pagination={pagination}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
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
