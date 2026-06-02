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
      variant='outline'
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className='border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
    >
      {theme === 'dark' ? <Sun className='size-4' /> : <Moon className='size-4' />}
    </Button>
  )
}
