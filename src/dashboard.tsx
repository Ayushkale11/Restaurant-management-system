import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DashboardApp from './DashboardApp.tsx'

createRoot(document.getElementById('dashboard-root')!).render(
  <StrictMode>
    <DashboardApp />
  </StrictMode>,
)
