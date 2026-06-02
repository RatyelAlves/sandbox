import { Button } from './ui/button'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav
      aria-label='Paginação de notas'
      className='mt-8 flex items-center justify-center gap-3'
    >
      <Button
        type='button'
        variant='outline'
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className='border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200'
      >
        Anterior
      </Button>

      <span className='text-sm text-zinc-600 dark:text-zinc-400'>
        Página {page} de {totalPages}
      </span>

      <Button
        type='button'
        variant='outline'
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className='border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200'
      >
        Próxima
      </Button>
    </nav>
  )
}
