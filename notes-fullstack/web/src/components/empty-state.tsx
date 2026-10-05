import { FileText } from 'lucide-react'

interface EmptyStateProps {
  hasSearch: boolean
}

export function EmptyState({ hasSearch }: EmptyStateProps) {
  return (
    <div className='col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/70 bg-white/75 p-12 text-center shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-zinc-900/70'>
      <div className='rounded-full bg-lime-500/15 p-4 dark:bg-indigo-400/15'>
        <FileText className='size-10 text-lime-600 dark:text-indigo-300' />
      </div>
      <div>
        <p className='text-zinc-900 dark:text-zinc-200 font-medium text-lg'>
          {hasSearch ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
        </p>
        <p className='text-zinc-600 dark:text-zinc-400 text-sm mt-1 max-w-sm'>
          {hasSearch
            ? 'Tente outro termo de busca ou limpe o filtro.'
            : 'Use o botão no canto inferior direito para criar a primeira nota.'}
        </p>
      </div>
    </div>
  )
}
