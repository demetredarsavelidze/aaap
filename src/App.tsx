import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { AchievementsPage } from './pages/AchievementsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { FocusPage } from './pages/FocusPage'
import { GoalsPage } from './pages/GoalsPage'
import { HabitsPage } from './pages/HabitsPage'
import { JournalPage } from './pages/JournalPage'
import { PlannerPage } from './pages/PlannerPage'
import { ReviewPage } from './pages/ReviewPage'
import { SettingsPage } from './pages/SettingsPage'
import { SkillsPage } from './pages/SkillsPage'
import { TodayPage } from './pages/TodayPage'
import { AppProvider } from './store/AppProvider'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/focus" element={<FocusPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AppProvider>
  )
}
