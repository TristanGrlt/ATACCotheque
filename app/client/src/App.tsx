import { Route, Routes } from 'react-router-dom'
import { LandingPage } from './routes/landingPage.tsx'
import { SideBar } from './components/admin/sideBar.tsx'

function App() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path='login' element={<LandingPage />} />
      <Route path='admin' element={<SideBar />}>
        <Route path='toto' element={<LandingPage />} />
      </Route>
    </Routes>
  )
}

export default App
