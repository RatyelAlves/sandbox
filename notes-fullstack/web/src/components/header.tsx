import { PenLineIcon } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

interface HeaderProps {
  total: number
  page: number
  totalPages: number
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Header({
  total,
  page,
  totalPages,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const notesLabel = total === 1 ? '1 nota' : `${total} notas`

  return (
    <header className='font-display relative mt-4 w-full rounded-2xl border border-white/60 bg-white/75 px-4 py-4 pr-16 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/70'>
      <div className='flex items-center gap-3'>
        <PenLineIcon className='size-6 text-lime-600 dark:text-indigo-300' />
        <div>
          <h1 className='text-xl font-semibold text-zinc-900 dark:text-zinc-100'>Notes</h1>
          <p className='text-sm text-zinc-600 dark:text-zinc-400'>
            {notesLabel} · Página {page} de {totalPages}
          </p>
        </div>
      </div>

      <div className='absolute top-1/2 right-3 -translate-y-1/2'>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}
