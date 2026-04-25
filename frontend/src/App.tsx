import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAppStore } from './store'

export default function App() {
  const initAuth = useAppStore((s) => s.initAuth)

  useEffect(() => {
    initAuth()
  }, [])

  return <RouterProvider router={router} />
}
