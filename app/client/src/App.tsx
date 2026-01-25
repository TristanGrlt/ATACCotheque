import { Route, Routes, Navigate } from 'react-router-dom'
import { LandingPage } from './routes/landingPage.tsx'
import { SideBar } from './components/admin/sideBar.tsx'
import { Login } from './routes/login.tsx'
import { ProtectedRoute } from './components/protectedRoute.tsx'
import { User } from './routes/admin/user/user.tsx'

function App() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path='login' element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path='admin' element={<SideBar />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path='dashboard' element={<div>Dashboard</div>} />
          <Route path='users' element={<User />} />
          <Route path='toto' element={<LandingPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
