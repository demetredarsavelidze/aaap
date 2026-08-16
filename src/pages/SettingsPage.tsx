import { useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import {
  addChallenge,
  addRule,
  deleteChallenge,
  deleteRule,
  toggleChallengeCheckin,
  updateChallenge,
  updateRule,
} from '../services/challengeService'
import { challengeProgress } from '../services/challengeService'
import { clearDemoData, addLifeArea, updateLifeArea, updateSettings, updateUser } from '../services/settingsService'
import { storageService } from '../services/storageService'
import { useApp } from '../store/useApp'
import type { Challenge, ChallengeUnit, LifeArea, PersonalRule, ThemePreference, WeekStartDay } from '../types'
import { todayKey } from '../utils/dates'

export function SettingsPage() {
  const { state, patch, toast, resetAll, loadDemo, importState } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [pendingChallenge, setPendingChallenge] = useState<Challenge | null>(null)
  const [ruleText, setRuleText] = useState('')
  const [pendingRule, setPendingRule] = useState<PersonalRule | null>(null)
  const [newArea, setNewArea] = useState('')
  const [newColor, setNewColor] = useState('#6d8cff')
  const today = todayKey()

  function exportData() {
    const blob = new Blob([storageService.exportJson(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ascension-${today}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast('Export downloaded.')
  }

  async function onImport(file: File | null) {
    if (!file) return
    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      const error = importState(parsed)
      if (error) toast(error, 'error')
    } catch {
      toast('Could not parse JSON file.', 'error')
    }
  }

  return (
    <>
      <div>
        <h1>Settings</h1>
        <p className="muted">Local configuration. Nothing leaves this browser unless you export it.</p>
      </div>

      <Card>
        <CardTitle>Profile</CardTitle>
        <Field label="Name">
          <Input
            value={state.user.name}
            onChange={(event) => patch((current) => updateUser(current, { name: event.target.value }))}
          />
        </Field>
      </Card>

      <Card>
        <CardTitle>Defaults</CardTitle>
        <div className="grid-2">
          <Field label="Default task XP">
            <Input
              type="number"
              min={0}
              value={state.settings.defaultTaskXp}
              onChange={(event) =>
                patch((current) => updateSettings(current, { defaultTaskXp: Number(event.target.value) }))
              }
            />
          </Field>
          <Field label="Default habit XP">
            <Input
              type="number"
              min={0}
              value={state.settings.defaultHabitXp}
              onChange={(event) =>
                patch((current) => updateSettings(current, { defaultHabitXp: Number(event.target.value) }))
              }
            />
          </Field>
          <Field label="Default focus duration (minutes)">
            <Input
              type="number"
              min={5}
              value={state.settings.defaultFocusMinutes}
              onChange={(event) =>
                patch((current) => updateSettings(current, { defaultFocusMinutes: Number(event.target.value) }))
              }
            />
          </Field>
          <Field label="Week starts on">
            <Select
              value={state.settings.weekStartsOn}
              onChange={(event) =>
                patch((current) =>
                  updateSettings(current, { weekStartsOn: Number(event.target.value) as WeekStartDay }),
                )
              }
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </Select>
          </Field>
          <Field label="Theme">
            <Select
              value={state.settings.theme}
              onChange={(event) =>
                patch((current) => updateSettings(current, { theme: event.target.value as ThemePreference }))
              }
            >
              <option value="dark">Dark</option>
              <option value="darker">Darker</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <CardTitle>Life Areas</CardTitle>
        <div className="stack">
          {state.lifeAreas
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((area) => (
              <LifeAreaRow
                key={area.id}
                area={area}
                onChange={(patchArea) => patch((current) => updateLifeArea(current, area.id, patchArea))}
              />
            ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <Input
            placeholder="New area name"
            value={newArea}
            onChange={(event) => setNewArea(event.target.value)}
            aria-label="New life area name"
          />
          <Input
            type="color"
            value={newColor}
            onChange={(event) => setNewColor(event.target.value)}
            aria-label="New life area color"
            style={{ width: 52, padding: 4 }}
          />
          <Button
            onClick={() => {
              if (!newArea.trim()) return
              patch((current) => addLifeArea(current, newArea, newColor))
              setNewArea('')
              toast('Life area added.')
            }}
          >
            Add
          </Button>
        </div>
      </Card>

      <Card>
        <div className="spread card-title">
          <h2>Challenges</h2>
          <Button
            size="small"
            onClick={() => {
              setEditingChallenge(null)
              setChallengeOpen(true)
            }}
          >
            New challenge
          </Button>
        </div>
        {state.challenges.length === 0 ? (
          <EmptyState title="No challenges" body="Keep this simple: a target, a window, a check-in." />
        ) : (
          state.challenges.map((challenge) => {
            const current = challengeProgress(state, challenge.id)
            const checked = state.challengeCheckins.some(
              (item) => item.challengeId === challenge.id && item.date === today,
            )
            return (
              <div key={challenge.id} className="stack" style={{ marginBottom: 14 }}>
                <div className="spread">
                  <strong>{challenge.name}</strong>
                  <span className="muted">
                    {current} / {challenge.target} {challenge.unit.toUpperCase()}
                  </span>
                </div>
                <ProgressBar value={(current / Math.max(1, challenge.target)) * 100} />
                <div className="row">
                  {challenge.status === 'active' ? (
                    <Button
                      size="small"
                      onClick={() => patch((currentState) => toggleChallengeCheckin(currentState, challenge.id, today))}
                    >
                      {checked ? 'Undo today' : 'Check in today'}
                    </Button>
                  ) : null}
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => {
                      setEditingChallenge(challenge)
                      setChallengeOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="small" variant="danger" onClick={() => setPendingChallenge(challenge)}>
                    Delete
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </Card>

      <Card>
        <CardTitle>Personal Rules</CardTitle>
        {state.personalRules.map((rule) => (
          <div key={rule.id} className="spread" style={{ padding: '8px 0' }}>
            <label className="check">
              <input
                type="checkbox"
                checked={rule.active}
                onChange={(event) =>
                  patch((current) => updateRule(current, rule.id, { active: event.target.checked }))
                }
              />
              <span>{rule.text}</span>
            </label>
            <Button size="small" variant="ghost" onClick={() => setPendingRule(rule)}>
              Delete
            </Button>
          </div>
        ))}
        <div className="row" style={{ marginTop: 8 }}>
          <Input
            placeholder="New rule"
            value={ruleText}
            onChange={(event) => setRuleText(event.target.value)}
            aria-label="New personal rule"
          />
          <Button
            onClick={() => {
              if (!ruleText.trim()) return
              patch((current) => addRule(current, { text: ruleText, checkDaily: true }))
              setRuleText('')
            }}
          >
            Add rule
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Data management</CardTitle>
        <div className="stack">
          <div className="row">
            <Button onClick={exportData}>Export JSON</Button>
            <Button onClick={() => fileRef.current?.click()}>Import JSON</Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(event) => {
                void onImport(event.target.files?.[0] ?? null)
                event.target.value = ''
              }}
            />
          </div>
          {state.demoActive ? (
            <Button onClick={() => setDemoOpen(true)}>Clear Demo Data</Button>
          ) : (
            <Button onClick={loadDemo}>Restore demo data</Button>
          )}
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            Reset all data
          </Button>
        </div>
      </Card>

      <ChallengeForm
        key={editingChallenge?.id ?? 'new'}
        open={challengeOpen}
        challenge={editingChallenge}
        areas={state.lifeAreas}
        onClose={() => setChallengeOpen(false)}
        onSubmit={(input) => {
          patch((current) =>
            editingChallenge ? updateChallenge(current, editingChallenge.id, input) : addChallenge(current, input),
          )
          setChallengeOpen(false)
          toast(editingChallenge ? 'Challenge updated.' : 'Challenge created.')
        }}
      />
      <ConfirmDialog
        open={demoOpen}
        title="Clear demo data"
        message="Removes every item marked as demo. Your own records stay. Empty states will appear where nothing remains."
        confirmLabel="Clear demo data"
        danger
        onCancel={() => setDemoOpen(false)}
        onConfirm={() => {
          patch(clearDemoData)
          setDemoOpen(false)
          toast('Demo data cleared.', 'info')
        }}
      />
      <ConfirmDialog
        open={resetOpen}
        title="Reset all data"
        message="This erases tasks, habits, goals, reviews, XP, and settings backups in localStorage. This cannot be undone unless you exported first."
        confirmLabel="Reset everything"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetAll()
          setResetOpen(false)
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingChallenge)}
        title="Delete challenge"
        message="Check-ins for this challenge will be removed."
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingChallenge(null)}
        onConfirm={() => {
          if (pendingChallenge) patch((current) => deleteChallenge(current, pendingChallenge.id))
          setPendingChallenge(null)
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingRule)}
        title="Delete rule"
        message="This personal rule will be removed."
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingRule(null)}
        onConfirm={() => {
          if (pendingRule) patch((current) => deleteRule(current, pendingRule.id))
          setPendingRule(null)
        }}
      />
    </>
  )
}

function LifeAreaRow({
  area,
  onChange,
}: {
  area: LifeArea
  onChange: (patch: Partial<Pick<LifeArea, 'name' | 'color' | 'archived'>>) => void
}) {
  return (
    <div className="row">
      <input
        type="color"
        value={area.color}
        onChange={(event) => onChange({ color: event.target.value })}
        aria-label={`${area.name} color`}
        style={{ width: 42, height: 36, padding: 4 }}
      />
      <Input value={area.name} onChange={(event) => onChange({ name: event.target.value })} aria-label={`${area.name} name`} />
      <label className="check">
        <input
          type="checkbox"
          checked={!area.archived}
          onChange={(event) => onChange({ archived: !event.target.checked })}
        />
        <span>Active</span>
      </label>
    </div>
  )
}

function ChallengeForm({
  open,
  challenge,
  areas,
  onClose,
  onSubmit,
}: {
  open: boolean
  challenge: Challenge | null
  areas: LifeArea[]
  onClose: () => void
  onSubmit: (input: {
    name: string
    description: string
    target: number
    unit: ChallengeUnit
    startDate: string
    endDate: string
    lifeAreaId: string
  }) => void
}) {
  const today = todayKey()
  const [name, setName] = useState(challenge?.name ?? '')
  const [description, setDescription] = useState(challenge?.description ?? '')
  const [target, setTarget] = useState(challenge?.target ?? 30)
  const [unit, setUnit] = useState<ChallengeUnit>(challenge?.unit ?? 'days')
  const [startDate, setStartDate] = useState(challenge?.startDate ?? today)
  const [endDate, setEndDate] = useState(challenge?.endDate ?? today)
  const [lifeAreaId, setLifeAreaId] = useState(challenge?.lifeAreaId ?? areas[0]?.id ?? '')

  return (
    <Modal open={open} title={challenge ? 'Edit challenge' : 'New challenge'} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({ name, description, target, unit, startDate, endDate, lifeAreaId })
        }}
      >
        <Field label="Name">
          <Input required value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <div className="grid-2">
          <Field label="Target">
            <Input type="number" min={1} value={target} onChange={(event) => setTarget(Number(event.target.value))} />
          </Field>
          <Field label="Unit">
            <Select value={unit} onChange={(event) => setUnit(event.target.value as ChallengeUnit)}>
              <option value="days">Days</option>
              <option value="hours">Hours</option>
              <option value="count">Count</option>
            </Select>
          </Field>
          <Field label="Start">
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </Field>
          <Field label="End">
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </Field>
        </div>
        <Field label="Life area">
          <Select value={lifeAreaId} onChange={(event) => setLifeAreaId(event.target.value)}>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}
