import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { TopBar } from './components/TopBar'
import { BottomNav } from './components/BottomNav'

export default function App() {
  return (
    <>
      <TopBar />
      <RouterProvider router={router} />
      <BottomNav />
    </>
  )
}
