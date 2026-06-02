import { FormEvent, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import type { CreateNoteInput } from '../types/note'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'

interface CreateNoteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateNote: (input: CreateNoteInput) => Promise<void>
  isCreating: boolean
  showCardTrigger?: boolean
}

export function CreateNoteForm({
  open,
  onOpenChange,
  onCreateNote,
  isCreating,
  showCardTrigger = true,
}: CreateNoteFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!content.trim()) {
      return
    }

    try {
      await onCreateNote({ title, content })
      setTitle('')
      setContent('')
      onOpenChange(false)
    } catch {
      // feedback via toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showCardTrigger && (
        <DialogTrigger className='group flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-4 transition-all hover:border-lime-400 hover:bg-lime-50 dark:border-zinc-600 dark:bg-zinc-800/50 dark:hover:border-lime-400 dark:hover:bg-zinc-800'>
          <div className='rounded-full bg-lime-500/10 p-3 transition-transform group-hover:scale-110'>
            <Plus className='size-6 text-lime-500' />
          </div>
          <span className='text-sm font-medium text-zinc-600 dark:text-zinc-300'>
            Criar nova nota
          </span>
        </DialogTrigger>
      )}

      <DialogContent className='border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'>
        <DialogHeader>Crie sua nota</DialogHeader>
        <form onSubmit={handleSubmit} className='mt-3 space-y-4'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='create-title'>Título</Label>
              <span className='text-xs text-zinc-500'>{title.length}/120</span>
            </div>
            <Input
              id='create-title'
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className='border-zinc-300 bg-zinc-50 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100'
              placeholder='Título (opcional)'
              maxLength={120}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='create-content'>Conteúdo</Label>
            <Textarea
              id='create-content'
              onChange={(event) => setContent(event.target.value)}
              value={content}
              className='min-h-32 border-zinc-300 bg-zinc-50 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100'
              placeholder='Digite o conteúdo'
              required
            />
          </div>

          <Button
            disabled={isCreating || !content.trim()}
            className='w-full bg-lime-500 font-medium text-zinc-900 hover:bg-lime-400'
          >
            {isCreating ? (
              <>
                <Loader2 className='size-4 animate-spin' />
                Criando...
              </>
            ) : (
              'Criar nota'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
