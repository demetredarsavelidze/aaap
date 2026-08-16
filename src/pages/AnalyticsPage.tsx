import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { computeAnalytics, dailyCompletionPercent, lifeAreaSnapshots } from '../services/analyticsService'
import { getAttentionItems } from '../services/attentionService'
import { computeAscensionScore } from '../services/scoreService'
import { useApp } from '../store/useApp'
import type { DateRangeKey } from '../types'

const RANGES: { key: DateRangeKey; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'all', label: 'All Time' },
]

const tooltipStyle = {
  background: '#15181f',
  border: '1px solid #232833',
  borderRadius: 8,
  color: '#f3f5f7',
}

export function AnalyticsPage() {
  const { state } = useApp()
  const [range, setRange] = useState<DateRangeKey>('30d')
  const analytics = computeAnalytics(state, range)
  const score = computeAscensionScore(state)
  const areas = lifeAreaSnapshots(state)
  const attention = getAttentionItems(state)
  const lineData = analytics.daily.map((day) => ({
    date: day.date.slice(5),
    completion: dailyCompletionPercent(day),
    xp: Math.max(0, day.xp),
  }))
  const barData = analytics.daily.map((day) => ({
    date: day.date.slice(5),
    hours: Math.round((day.focusMinutes / 60) * 10) / 10,
  }))

  return (
    <>
      <div className="spread">
        <div>
          <h1>Analytics</h1>
          <p className="muted">All figures are computed from stored activity — not placeholders.</p>
        </div>
        <div className="tabs">
          {RANGES.map((item) => (
            <Button key={item.key} size="small" variant={range === item.key ? 'primary' : 'default'} onClick={() => setRange(item.key)}>
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="kpis">
        <Kpi label="Task completion" value={`${analytics.taskCompletionRate}%`} />
        <Kpi label="Habit consistency" value={`${analytics.habitConsistency}%`} />
        <Kpi label="Focus hours" value={`${analytics.focusHours}`} />
        <Kpi label="XP earned" value={`${analytics.xpEarned}`} />
        <Kpi label="Tasks completed" value={`${analytics.tasksCompleted}`} />
        <Kpi label="Goals progressed" value={`${analytics.goalsProgressed}`} />
        <Kpi label="Current streak" value={`${analytics.currentStreak}d`} />
        <Kpi label="Longest streak" value={`${analytics.longestStreak}d`} />
      </div>

      <div className="grid-2">
        <Card>
          <CardTitle>Completion and XP</CardTitle>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid stroke="#232833" />
                <XAxis dataKey="date" stroke="#8b919c" fontSize={11} />
                <YAxis stroke="#8b919c" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="completion" stroke="#6d8cff" dot={false} name="Completion %" />
                <Line type="monotone" dataKey="xp" stroke="#3dd68c" dot={false} name="XP" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle>Focus hours</CardTitle>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid stroke="#232833" />
                <XAxis dataKey="date" stroke="#8b919c" fontSize={11} />
                <YAxis stroke="#8b919c" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="hours" fill="#6d8cff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <CardTitle>Ascension Score {score.score} / 100</CardTitle>
          <p className="muted" style={{ marginBottom: 12 }}>
            7-day weighted index: tasks 25%, habits 25%, focus 20%, goals 15%, area balance 15%.
          </p>
          <ScoreRow label="Task completion" value={score.taskCompletion} />
          <ScoreRow label="Habit consistency" value={score.habitConsistency} />
          <ScoreRow label="Focus activity" value={score.focusActivity} />
          <ScoreRow label="Goal momentum" value={score.goalMomentum} />
          <ScoreRow label="Area balance" value={score.areaBalance} />
          <div style={{ marginTop: 16 }}>
            {score.areas.map((area) => (
              <div key={area.areaId} className="map-row">
                <span>{area.name}</span>
                <span>{area.score}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Life Areas</CardTitle>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={areas.map((area) => ({ area: area.name, score: area.score }))}>
                <PolarGrid stroke="#232833" />
                <PolarAngleAxis dataKey="area" tick={{ fill: '#8b919c', fontSize: 11 }} />
                <Radar dataKey="score" stroke="#6d8cff" fill="#6d8cff" fillOpacity={0.25} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <CardTitle>Ascension Map</CardTitle>
          {areas.map((area) => (
            <div key={area.areaId} className="map-row">
              <span>{area.name}</span>
              <span className={`trend-${area.trend}`}>
                {area.trend === 'up' ? '↑ improving' : area.trend === 'down' ? '↓ declining' : '→ stable'}
              </span>
            </div>
          ))}
        </Card>
        <Card>
          <CardTitle>Needs Attention</CardTitle>
          {attention.length === 0 ? (
            <p className="muted">No neglect signals in the current window.</p>
          ) : (
            attention.map((item) => (
              <p key={item.id} className={`attention ${item.severity}`}>
                {item.message}
              </p>
            ))
          )}
        </Card>
      </div>
    </>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </Card>
  )
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="map-row">
      <span>{label}</span>
      <Badge>{value}</Badge>
    </div>
  )
}
