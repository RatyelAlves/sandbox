import { PenLineIcon, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { ThemeToggle } from './theme-toggle'

interface HeaderProps {
  total: number
  page: number
  totalPages: number
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onCreateNote: () => void
}

export function Header({
  total,
  page,
  totalPages,
  theme,
  onToggleTheme,
  onCreateNote,
}: HeaderProps) {
  const notesLabel = total === 1 ? '1 nota' : `${total} notas`

  return (
    <header className='py-4 w-full border-b border-zinc-200 dark:border-zinc-700/50'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <PenLineIcon className='size-6 text-lime-500' />
          <div>
            <h1 className='text-xl font-semibold text-zinc-900 dark:text-zinc-100'>Notes</h1>
            <p className='text-sm text-zinc-600 dark:text-zinc-400'>
              {notesLabel} · Página {page} de {totalPages}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <Button
            type='button'
            onClick={onCreateNote}
            className='bg-lime-500 text-zinc-900 hover:bg-lime-400 font-medium'
          >
            <Plus className='size-4' />
            Nova nota
          </Button>
        </div>
      </div>
    </header>
  )
}
