import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatNoteDate } from '../lib/format-date'
import type { Note, UpdateNoteInput } from '../types/note'
import { EditNoteForm } from './edit-note-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from './ui/dialog'

interface NoteCardProps {
  note: Note
  onUpdateNote: (id: string, input: UpdateNoteInput) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
}

export function NoteCard({ note, onUpdateNote, onDeleteNote }: NoteCardProps) {
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)

  function resetDialog() {
    setIsEditing(false)
  }

  function openEditMode() {
    setIsEditing(true)
    setOpen(true)
  }

  async function handleSave(input: UpdateNoteInput) {
    await onUpdateNote(note.id, input)
    setIsEditing(false)
    setOpen(false)
  }

  async function handleDelete() {
    setIsDeleting(true)

    try {
      await onDeleteNote(note.id)
      setDeleteOpen(false)
      setOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleTouchStart(clientX: number) {
    setTouchStartX(clientX)
  }

  function handleTouchMove(clientX: number) {
    if (touchStartX === null) {
      return
    }

    const offset = Math.min(0, clientX - touchStartX)
    setSwipeOffset(offset)
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX === null) {
      return
    }

    const delta = clientX - touchStartX

    if (delta < -80) {
      setDeleteOpen(true)
    }

    setTouchStartX(null)
    setSwipeOffset(0)
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value)
          if (!value) {
            resetDialog()
          }
        }}
      >
        <div
          className='relative animate-in fade-in slide-in-from-bottom-2 duration-300'
          style={{ transform: swipeOffset ? `translateX(${swipeOffset}px)` : undefined }}
          onTouchStart={(event) => handleTouchStart(event.touches[0].clientX)}
          onTouchMove={(event) => handleTouchMove(event.touches[0].clientX)}
          onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX)}
        >
          <DialogTrigger
            onClick={() => setIsEditing(false)}
            className='flex w-full flex-col items-start rounded-2xl border border-l-4 border-white/60 border-l-lime-500 bg-white/75 px-4 py-3 pr-12 text-left shadow-sm backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] md:min-h-[140px] md:gap-3 md:p-4 md:pr-14 dark:border-white/10 dark:border-l-indigo-400 dark:bg-zinc-900/70'
          >
            {note.title ? (
              <strong className='line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
                {note.title}
              </strong>
            ) : (
              <strong className='line-clamp-1 text-sm font-medium italic text-zinc-500'>
                Sem título
              </strong>
            )}

            <span className='hidden text-sm text-zinc-600 dark:text-zinc-300 md:line-clamp-4 md:flex md:flex-1'>
              {note.content}
            </span>

            <time
              className='hidden text-xs font-medium text-zinc-500 dark:text-zinc-400 md:block'
              title={formatNoteDate(note.createdAt, 'full')}
            >
              {formatNoteDate(note.createdAt, 'relative')}
            </time>
          </DialogTrigger>

          <button
            type='button'
            aria-label='Editar nota'
            onClick={(event) => {
              event.stopPropagation()
              openEditMode()
            }}
            className='absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2.5 text-lime-700 transition-colors hover:bg-lime-50 hover:text-lime-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:text-indigo-300 dark:hover:bg-zinc-700 dark:hover:text-indigo-200 dark:focus-visible:ring-indigo-400 md:top-3 md:right-3 md:translate-y-0 md:p-2'
          >
            <Pencil className='size-5 sm:size-4' />
          </button>
        </div>

        <DialogContent className='border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'>
          {isEditing ? (
            <EditNoteForm
              note={note}
              onSave={handleSave}
              onCancel={() => {
                setIsEditing(false)
                setOpen(false)
              }}
            />
          ) : (
            <div className='space-y-4'>
              {note.title ? (
                <h2 className='text-xl font-semibold'>{note.title}</h2>
              ) : (
                <h2 className='text-xl font-semibold italic text-zinc-500'>Sem título</h2>
              )}

              <p className='whitespace-pre-wrap text-zinc-700 dark:text-zinc-300'>{note.content}</p>

              <div className='flex items-center justify-between gap-4'>
                <time
                  className='text-sm text-zinc-500 dark:text-zinc-400'
                  title={formatNoteDate(note.createdAt, 'full')}
                >
                  {formatNoteDate(note.createdAt, 'full')}
                </time>

                <Button
                  type='button'
                  variant='outline'
                  className='border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20'
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className='size-4' />
                  Apagar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. A nota será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                type='button'
                variant='outline'
                className='border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600'
              >
                Cancelar
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type='button'
                disabled={isDeleting}
                className='bg-red-500 text-white hover:bg-red-600'
                onClick={(event) => {
                  event.preventDefault()
                  handleDelete()
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className='size-4 animate-spin' />
                    Apagando...
                  </>
                ) : (
                  'Apagar'
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
