import { Route, Routes } from 'react-router-dom'
import { LandingPage } from './routes/landingPage.tsx'
import { SearchSandbox } from './routes/SearchSandbox.tsx'
import { SideBar } from './components/admin/sideBar.tsx'
import { Login } from './routes/login.tsx'
import { ProtectedRoute } from './components/protectedRoute.tsx'

function App() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="sandbox" element={<SearchSandbox />} />
      <Route path='login' element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path='admin' element={<SideBar />}>
          <Route path='dashboard' element={<div>Dashboard</div>} />
          <Route path='users' element={<div>Users</div>} />
          <Route path='toto' element={<LandingPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
