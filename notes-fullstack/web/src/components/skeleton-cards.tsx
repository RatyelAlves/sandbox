export function NoteCardSkeleton() {
  return (
    <div className='animate-pulse rounded-2xl border border-zinc-200 bg-white p-4 min-h-[140px] dark:border-zinc-700 dark:bg-zinc-800'>
      <div className='h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700' />
      <div className='mt-4 space-y-2'>
        <div className='h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700' />
        <div className='h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-700' />
        <div className='h-3 w-4/6 rounded bg-zinc-200 dark:bg-zinc-700' />
      </div>
      <div className='mt-8 h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700' />
    </div>
  )
}

export function SkeletonGrid() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <NoteCardSkeleton key={index} />
      ))}
    </>
  )
}
