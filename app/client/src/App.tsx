import { Route, Routes, Navigate } from 'react-router-dom'
import { LandingPage } from './routes/landingPage.tsx'
import { SearchSandbox } from './routes/SearchSandbox.tsx'
import { SideBar } from './components/admin/sideBar.tsx'
import { Login } from './routes/login.tsx'
import { ProtectedRoute } from './components/protectedRoute.tsx'
import { PermissionRoute } from './components/permissionRoute.tsx'
import { GuestRoute } from './components/guestRoute.tsx'
import { UserIndex } from './routes/admin/user/userIndex.tsx'
import { AddUser } from './components/admin/user/addUser.tsx'
import { NotFound } from './routes/notFound.tsx'
import { Unauthorized } from './routes/unauthorized.tsx'
import { useAuth } from './contexts/AuthContext.tsx'
import { Loading } from './components/loading.tsx'
import { PERMISSIONS } from './config/permissions.ts'
import OnboardingPage from './routes/onboarding/onboardingPage.tsx'
import { MfaChallenge } from './routes/mfaChallenge.tsx'
import Dashboard from './routes/admin/dashboard/dashboard.tsx'

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
      <Route path="sandbox" element={<SearchSandbox />} />
      
      {/* Routes pour invités uniquement (non connectés) */}
      <Route element={<GuestRoute />}>
        <Route path='login' element={<Login />} />
      </Route>

      { /* Route pour l'onboarding (vérifie l'authentification et la non réalisation de son onboarding pour y accéder) */}
      <Route path="onboarding" element={<OnboardingPage />} />

      {/* Route MFA challenge — accessible uniquement avec le pre_auth cookie, pas de guard auth */}
      <Route path="mfa-challenge" element={<MfaChallenge />} />

      {/* Routes protégées par authentification */}
      <Route element={<ProtectedRoute />}>
        <Route path='admin' element={<SideBar />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='toto' element={<LandingPage />} />
          
          {/* Routes protégées par permissions */}
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
