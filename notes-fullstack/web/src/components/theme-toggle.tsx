import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'

interface ThemeToggleProps {
  theme: 'light' | 'dark'
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className='rounded-full border-0 bg-lime-500/15 text-lime-700 shadow-none hover:bg-lime-500/25 dark:bg-indigo-400/20 dark:text-indigo-200 dark:hover:bg-indigo-400/30'
    >
      {theme === 'dark' ? <Sun className='size-4' /> : <Moon className='size-4' />}
    </Button>
  )
}
