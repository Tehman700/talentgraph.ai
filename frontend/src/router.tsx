import { createBrowserRouter, Link, Outlet, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { TopBar } from './components/TopBar'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Onboard from './pages/Onboard'
import OnboardTech from './pages/OnboardTech'
import OnboardNonTech from './pages/OnboardNonTech'
import OnboardOrg from './pages/OnboardOrg'
import Explore from './pages/Explore'
import OrgMatches from './pages/OrgMatches'
import SkillsProfile from './pages/SkillsProfile'
import Opportunities from './pages/Opportunities'
import PolicyDashboard from './pages/PolicyDashboard'
import Dashboard from './pages/Dashboard'

function RootLayout() {
  return (
    <>
      <TopBar />
      <Outlet />
    </>
  )
}

function RouteErrorPage() {
  const error = useRouteError()
  let title = 'Page not found'
  let message = 'The page you requested does not exist or was moved.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    if (error.status === 404) {
      message = 'That route does not exist. Use the navigation below to continue.'
    }
  }

  return (
    <div
      style={{
        minHeight: '100svh',
        background: '#f6f4ef',
        color: '#0e0e12',
        fontFamily: 'var(--font-mono)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <div style={{ color: '#6b6458', letterSpacing: '0.2em', fontSize: 11 }} className="uppercase mb-3">
          TalentGraph
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(30px, 5vw, 54px)',
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p style={{ color: '#6b6458', marginTop: 14, marginBottom: 22 }}>{message}</p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            textDecoration: 'none',
            background: '#0e0e12',
            color: '#f6f4ef',
            padding: '10px 18px',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/explore', element: <Explore /> },
      { path: '/onboard', element: <Onboard /> },
      { path: '/onboard-tech', element: <OnboardTech /> },
      { path: '/onboard-non-tech', element: <OnboardNonTech /> },
      { path: '/onboard-org', element: <OnboardOrg /> },
      { path: '/onboarding', element: <Onboarding /> },
      { path: '/profile', element: <SkillsProfile /> },
      { path: '/opportunities', element: <Opportunities /> },
      { path: '/policy',      element: <PolicyDashboard /> },
      { path: '/dashboard',   element: <Dashboard /> },
      { path: '/org/:id', element: <OrgMatches /> },
      { path: '*', element: <RouteErrorPage /> },
    ],
  },
])
