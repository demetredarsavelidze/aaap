import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { MOOD_LABELS } from '../constants'
import { addJournalEntry, deleteJournalEntry, updateJournalEntry } from '../services/reviewService'
import { useApp } from '../store/useApp'
import type { JournalEntry, Mood } from '../types'
import { todayKey } from '../utils/dates'

export function JournalPage() {
  const { state, patch, toast } = useApp()
  const [query, setQuery] = useState('')
  const [date, setDate] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const [pending, setPending] = useState<JournalEntry | null>(null)

  const entries = useMemo(() => {
    return [...state.journalEntries]
      .filter((entry) => {
        const hay = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase()
        const matchesQuery = query.trim() === '' || hay.includes(query.toLowerCase())
        const matchesDate = date === '' || entry.date === date
        return matchesQuery && matchesDate
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [state.journalEntries, query, date])

  return (
    <>
      <div className="spread">
        <div>
          <h1>Journal</h1>
          <p className="muted">Date-based notes. Keep it clean.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          New entry
        </Button>
      </div>

      <div className="grid-2">
        <Field label="Search">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, body, or tag" />
        </Field>
        <Field label="Browse by date">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
      </div>

      {entries.length === 0 ? (
        <Card>
          <EmptyState title="No entries" body="Write a short record of the day. Search and dates stay local." />
        </Card>
      ) : (
        entries.map((entry) => (
          <Card key={entry.id}>
            <div className="spread">
              <div>
                <h2>{entry.title || 'Untitled'}</h2>
                <div className="task-meta">
                  <span>{entry.date}</span>
                  <Badge>{MOOD_LABELS[entry.mood]}</Badge>
                  {entry.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="row">
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(entry)
                    setOpen(true)
                  }}
                >
                  Edit
                </Button>
                <Button size="small" variant="danger" onClick={() => setPending(entry)}>
                  Delete
                </Button>
              </div>
            </div>
            <p style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>{entry.content}</p>
          </Card>
        ))
      )}

      <JournalForm
        key={editing?.id ?? 'new'}
        open={open}
        entry={editing}
        onClose={() => setOpen(false)}
        onSubmit={(input) => {
          patch((current) => (editing ? updateJournalEntry(current, editing.id, input) : addJournalEntry(current, input)))
          setOpen(false)
          toast(editing ? 'Entry updated.' : 'Entry saved.')
        }}
      />
      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete entry"
        message="This journal entry will be removed."
        confirmLabel="Delete"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) patch((current) => deleteJournalEntry(current, pending.id))
          setPending(null)
        }}
      />
    </>
  )
}

function JournalForm({
  open,
  entry,
  onClose,
  onSubmit,
}: {
  open: boolean
  entry: JournalEntry | null
  onClose: () => void
  onSubmit: (input: { title: string; content: string; date: string; mood: Mood; tags: string[] }) => void
}) {
  const [title, setTitle] = useState(entry?.title ?? '')
  const [content, setContent] = useState(entry?.content ?? '')
  const [date, setDate] = useState(entry?.date ?? todayKey())
  const [mood, setMood] = useState<Mood>(entry?.mood ?? 'ok')
  const [tags, setTags] = useState(entry?.tags.join(', ') ?? '')

  return (
    <Modal open={open} title={entry ? 'Edit entry' : 'New entry'} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({
            title,
            content,
            date,
            mood,
            tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          })
        }}
      >
        <Field label="Title">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Field label="Mood">
          <Select value={mood} onChange={(event) => setMood(event.target.value as Mood)}>
            {Object.entries(MOOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tags (comma separated)">
          <Input value={tags} onChange={(event) => setTags(event.target.value)} />
        </Field>
        <Field label="Entry">
          <Textarea style={{ minHeight: 180 }} value={content} onChange={(event) => setContent(event.target.value)} />
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
