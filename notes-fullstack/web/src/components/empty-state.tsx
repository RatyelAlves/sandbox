import { FileText, Plus } from 'lucide-react'
import { Button } from './ui/button'

interface EmptyStateProps {
  onCreateNote: () => void
  hasSearch: boolean
}

export function EmptyState({ onCreateNote, hasSearch }: EmptyStateProps) {
  return (
    <div className='col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-800/40'>
      <div className='rounded-full bg-lime-500/10 p-4'>
        <FileText className='size-10 text-lime-500' />
      </div>
      <div>
        <p className='text-zinc-900 dark:text-zinc-200 font-medium text-lg'>
          {hasSearch ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
        </p>
        <p className='text-zinc-600 dark:text-zinc-400 text-sm mt-1 max-w-sm'>
          {hasSearch
            ? 'Tente outro termo de busca ou limpe o filtro.'
            : 'Comece criando sua primeira nota.'}
        </p>
      </div>
      {!hasSearch && (
        <Button
          type='button'
          onClick={onCreateNote}
          className='bg-lime-500 text-zinc-900 hover:bg-lime-400 font-medium'
        >
          <Plus className='size-4' />
          Criar primeira nota
        </Button>
      )}
    </div>
  )
}
