import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SKILL_LEVEL_LABELS, SKILL_LEVELS } from '../constants'
import { addSkill, deleteSkill, toggleSkillMilestone, updateSkill } from '../services/skillService'
import { skillHours } from '../services/selectors'
import { useApp } from '../store/useApp'
import type { Skill, SkillLevel } from '../types'

export function SkillsPage() {
  const { state, patch, toast } = useApp()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Skill | null>(null)
  const [pending, setPending] = useState<Skill | null>(null)

  return (
    <>
      <div className="spread">
        <div>
          <h1>Skills</h1>
          <p className="muted">Hours are derived from focus sessions plus any manual baseline.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          New skill
        </Button>
      </div>

      {state.skills.length === 0 ? (
        <Card>
          <EmptyState title="No skills tracked" body="Add the few capabilities you actually intend to compound." />
        </Card>
      ) : (
        <div className="grid-2">
          {state.skills.map((skill) => {
            const hours = skillHours(state, skill.id)
            const done = skill.milestones.filter((item) => item.completed).length
            return (
              <Card key={skill.id}>
                <div className="spread">
                  <h2>{skill.name}</h2>
                  <Badge>{SKILL_LEVEL_LABELS[skill.currentLevel]}</Badge>
                </div>
                <p className="muted">{skill.category}</p>
                <p style={{ margin: '8px 0' }}>{skill.target}</p>
                <div className="task-meta">
                  <span>{hours}h invested</span>
                  <span>
                    {done}/{skill.milestones.length} milestones
                  </span>
                </div>
                <div style={{ margin: '10px 0' }}>
                  <ProgressBar
                    value={skill.milestones.length ? (done / skill.milestones.length) * 100 : Math.min(100, hours * 5)}
                  />
                </div>
                {skill.notes ? <p className="muted">{skill.notes}</p> : null}
                <div className="stack" style={{ marginTop: 10 }}>
                  {skill.milestones.map((milestone) => (
                    <label key={milestone.id} className="check">
                      <input
                        type="checkbox"
                        checked={milestone.completed}
                        onChange={() => patch((current) => toggleSkillMilestone(current, skill.id, milestone.id))}
                      />
                      <span>{milestone.title}</span>
                    </label>
                  ))}
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditing(skill)
                      setFormOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="small" variant="danger" onClick={() => setPending(skill)}>
                    Delete
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <SkillForm
        key={editing?.id ?? 'new'}
        open={formOpen}
        skill={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          patch((current) => (editing ? updateSkill(current, editing.id, input) : addSkill(current, input)))
          setFormOpen(false)
          toast(editing ? 'Skill updated.' : 'Skill added.')
        }}
      />
      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete skill"
        message="Focus history remains. This only removes the skill record."
        confirmLabel="Delete"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) patch((current) => deleteSkill(current, pending.id))
          setPending(null)
        }}
      />
    </>
  )
}

function SkillForm({
  open,
  skill,
  onClose,
  onSubmit,
}: {
  open: boolean
  skill: Skill | null
  onClose: () => void
  onSubmit: (input: {
    name: string
    category: string
    currentLevel: SkillLevel
    target: string
    manualHours: number
    notes: string
    milestones: string[]
  }) => void
}) {
  const [name, setName] = useState(skill?.name ?? '')
  const [category, setCategory] = useState(skill?.category ?? '')
  const [currentLevel, setCurrentLevel] = useState<SkillLevel>(skill?.currentLevel ?? 'beginner')
  const [target, setTarget] = useState(skill?.target ?? '')
  const [manualHours, setManualHours] = useState(skill?.manualHours ?? 0)
  const [notes, setNotes] = useState(skill?.notes ?? '')
  const [milestones, setMilestones] = useState(skill?.milestones.map((item) => item.title).join('\n') ?? '')

  useEffect(() => {
    if (!open) return
    setName(skill?.name ?? '')
    setCategory(skill?.category ?? '')
    setCurrentLevel(skill?.currentLevel ?? 'beginner')
    setTarget(skill?.target ?? '')
    setManualHours(skill?.manualHours ?? 0)
    setNotes(skill?.notes ?? '')
    setMilestones(skill?.milestones.map((item) => item.title).join('\n') ?? '')
  }, [open, skill])

  return (
    <Modal open={open} title={skill ? 'Edit skill' : 'New skill'} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({
            name,
            category,
            currentLevel,
            target,
            manualHours,
            notes,
            milestones: milestones.split('\n'),
          })
        }}
      >
        <Field label="Name">
          <Input required value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Category">
          <Input value={category} onChange={(event) => setCategory(event.target.value)} />
        </Field>
        <Field label="Level">
          <Select value={currentLevel} onChange={(event) => setCurrentLevel(event.target.value as SkillLevel)}>
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {SKILL_LEVEL_LABELS[level]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Target">
          <Input value={target} onChange={(event) => setTarget(event.target.value)} />
        </Field>
        <Field label="Manual hours (outside the timer)">
          <Input type="number" min={0} value={manualHours} onChange={(event) => setManualHours(Number(event.target.value))} />
        </Field>
        <Field label="Notes">
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
        <Field label="Milestones (one per line)">
          <Textarea value={milestones} onChange={(event) => setMilestones(event.target.value)} />
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
