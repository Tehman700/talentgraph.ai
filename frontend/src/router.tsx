import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import SkillsProfile from './pages/SkillsProfile'
import Opportunities from './pages/Opportunities'
import PolicyDashboard from './pages/PolicyDashboard'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/onboarding', element: <Onboarding /> },
  { path: '/profile', element: <SkillsProfile /> },
  { path: '/opportunities', element: <Opportunities /> },
  { path: '/policy', element: <PolicyDashboard /> },
])
