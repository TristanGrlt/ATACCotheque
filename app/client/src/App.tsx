import { Route, Routes } from 'react-router-dom'
import { LandingPage } from './routes/landingPage.tsx'
import { SideBar } from './components/admin/sideBar.tsx'
import { Login } from './routes/login.tsx'

function App() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path='login' element={<Login />} />
      <Route path='admin' element={<SideBar />}>
        <Route path='toto' element={<LandingPage />} />
      </Route>
    </Routes>
  )
}

export default App
