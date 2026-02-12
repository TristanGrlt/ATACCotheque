import { Route, Routes, Navigate } from 'react-router-dom'
import { LandingPage } from './routes/landingPage.tsx'
import { SearchSandbox } from './routes/SearchSandbox.tsx'
import { SideBar } from './components/admin/sideBar.tsx'
import { Login } from './routes/login.tsx'
import { ProtectedRoute } from './components/protectedRoute.tsx'
import { UserIndex } from './routes/admin/user/userIndex.tsx'
import { AddUser } from './components/admin/user/addUser.tsx'
import { useAuth } from './contexts/AuthContext.tsx'

function App() {
  const { perms } = useAuth();

  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="sandbox" element={<SearchSandbox />} />
      <Route path='login' element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path='admin' element={<SideBar />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path='dashboard' element={<AddUser />} />
          {perms.includes('MANAGE_ROLES') ? <Route path='users' element={<UserIndex />} /> : null}
          <Route path='toto' element={<LandingPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
 
export default App
