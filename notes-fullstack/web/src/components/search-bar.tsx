import { Search, X } from 'lucide-react'
import { Input } from './ui/input'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className='relative'>
      <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-lime-600 dark:text-indigo-300' />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='Buscar por título ou conteúdo...'
        aria-label='Buscar notas'
        className='h-11 rounded-2xl border-white/60 bg-white/75 pl-10 pr-10 text-zinc-900 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-100'
      />
      {value && (
        <button
          type='button'
          aria-label='Limpar busca'
          onClick={() => onChange('')}
          className='absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'
        >
          <X className='size-4' />
        </button>
      )}
    </div>
  )
}
