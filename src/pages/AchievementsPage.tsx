import { Lock, Medal } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { computeAchievements } from '../services/achievementService'
import { useApp } from '../store/useApp'

export function AchievementsPage() {
  const { state } = useApp()
  const achievements = computeAchievements(state)
  const unlocked = achievements.filter((item) => item.unlocked).length

  return (
    <>
      <div>
        <h1>Achievements</h1>
        <p className="muted">
          {unlocked} / {achievements.length} unlocked. These are derived from live data and cannot be toggled.
        </p>
      </div>
      <div className="grid-2">
        {achievements.map((item) => (
          <Card key={item.id} className={item.unlocked ? '' : 'locked'}>
            <div className="row">
              {item.unlocked ? <Medal size={18} /> : <Lock size={18} />}
              <div>
                <h2>{item.title}</h2>
                <p className="muted">{item.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
