import { createBrowserRouter, Outlet } from 'react-router-dom'
import { TopBar } from './components/TopBar'
import { BottomNav } from './components/BottomNav'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import SkillsProfile from './pages/SkillsProfile'
import Opportunities from './pages/Opportunities'
import PolicyDashboard from './pages/PolicyDashboard'

function RootLayout() {
  return (
    <>
      <TopBar />
      <Outlet />
      <BottomNav />
    </>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/onboarding', element: <Onboarding /> },
      { path: '/profile', element: <SkillsProfile /> },
      { path: '/opportunities', element: <Opportunities /> },
      { path: '/policy', element: <PolicyDashboard /> },
    ],
  },
])
