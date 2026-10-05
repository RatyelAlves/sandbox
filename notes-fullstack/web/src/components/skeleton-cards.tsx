export function NoteCardSkeleton() {
  return (
    <div className='animate-pulse rounded-2xl border border-l-4 border-white/60 border-l-lime-500 bg-white/75 px-4 py-3 backdrop-blur-md md:min-h-[140px] md:p-4 dark:border-white/10 dark:border-l-indigo-400 dark:bg-zinc-900/70'>
      <div className='h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700' />
      <div className='mt-4 hidden space-y-2 md:block'>
        <div className='h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700' />
        <div className='h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-700' />
        <div className='h-3 w-4/6 rounded bg-zinc-200 dark:bg-zinc-700' />
      </div>
      <div className='mt-8 hidden h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700 md:block' />
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
