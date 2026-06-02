import { Loader2 } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { formatNoteDate } from '../lib/format-date'
import type { Note, UpdateNoteInput } from '../types/note'
import { Button } from './ui/button'
import { DialogHeader } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'

interface EditNoteFormProps {
  note: Note
  onSave: (input: UpdateNoteInput) => Promise<void>
  onCancel: () => void
}

export function EditNoteForm({ note, onSave, onCancel }: EditNoteFormProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
  }, [note.id, note.title, note.content])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!content.trim()) {
      return
    }

    setIsSaving(true)

    try {
      await onSave({ title, content })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <DialogHeader>Editar nota</DialogHeader>

      <p className='text-xs text-zinc-500 dark:text-zinc-400'>
        Criada {formatNoteDate(note.createdAt, 'relative')} · {formatNoteDate(note.createdAt, 'full')}
      </p>

      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <Label htmlFor='edit-title'>Título</Label>
          <span className='text-xs text-zinc-500'>{title.length}/120</span>
        </div>
        <Input
          id='edit-title'
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className='border-zinc-300 bg-zinc-50 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100'
          placeholder='Título'
          maxLength={120}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='edit-content'>Conteúdo</Label>
        <Textarea
          id='edit-content'
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className='min-h-32 border-zinc-300 bg-zinc-50 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100'
          placeholder='Conteúdo da nota'
          required
        />
      </div>

      <div className='flex gap-3 justify-end'>
        <Button
          type='button'
          variant='outline'
          className='border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600'
          onClick={onCancel}
        >
          Cancelar
        </Button>

        <Button
          type='submit'
          disabled={isSaving || !content.trim()}
          className='bg-lime-500 font-medium text-zinc-900 hover:bg-lime-400'
        >
          {isSaving ? (
            <>
              <Loader2 className='size-4 animate-spin' />
              Salvando...
            </>
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </div>
    </form>
  )
}
