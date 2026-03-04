import { Route, Routes, Navigate } from 'react-router-dom'
import { LandingPage } from './routes/landingPage.tsx'
import { Search } from './routes/Search.tsx'
import { ExamDetail } from './routes/examDetail.tsx'
import { SideBar } from './components/admin/sideBar.tsx'
import { Login } from './routes/login.tsx'
import { ProtectedRoute } from './components/protectedRoute.tsx'
import { PermissionRoute } from './components/permissionRoute.tsx'
import { GuestRoute } from './components/guestRoute.tsx'
import { UserIndex } from './routes/admin/user/userIndex.tsx'
import { AddUser } from './components/admin/user/addUser.tsx'
import { ExamIndex } from './routes/admin/exam/examIndex.tsx'
import { ExamsReview } from './routes/admin/exam/examsReview.tsx'
import { NotFound } from './routes/notFound.tsx'
import { Unauthorized } from './routes/unauthorized.tsx'
import { useAuth } from './contexts/AuthContext.tsx'
import { Loading } from './components/loading.tsx'
import { PERMISSIONS } from './config/permissions.ts'

function App() {
  const { isLoading } = useAuth()

  // Attendre que l'authentification soit vérifiée avant de rendre les routes
  // Évite les redirections indésirables et le flicker
  if (isLoading) {
    return <Loading />
  }

  return (
    <Routes>
      {/* Routes publiques */}
      <Route index element={<LandingPage />} />
      <Route path="search" element={<Search />} />
      <Route path="exam/:examId" element={<ExamDetail />} />
      
      {/* Routes pour invités uniquement (non connectés) */}
      <Route element={<GuestRoute />}>
        <Route path='login' element={<Login />} />
      </Route>

      {/* Routes protégées par authentification */}
      <Route element={<ProtectedRoute />}>
        <Route path='admin' element={<SideBar />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path='dashboard' element={<AddUser />} />
          
          {/* Routes protégées par permissions */}
          <Route element={<PermissionRoute requiredPermissions={[PERMISSIONS.MANAGE_ANNALES]} />}>
            <Route path='exams' element={<ExamIndex />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={[PERMISSIONS.REVIEW_ANNALES]} />}>
            <Route path='exams-review' element={<ExamsReview />} />
          </Route>
          <Route element={<PermissionRoute requiredPermissions={[PERMISSIONS.MANAGE_ROLES]} />}>
            <Route path='users' element={<UserIndex />} />
          </Route>
        </Route>
      </Route>

      {/* Pages d'erreur */}
      <Route path='unauthorized' element={<Unauthorized />} />
      <Route path='*' element={<NotFound />} />
    </Routes>
  )
}
 
export default App
