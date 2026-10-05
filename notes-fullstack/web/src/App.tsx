import { CreateNoteForm } from './components/create-note-form'
import { EmptyState } from './components/empty-state'
import { Header } from './components/header'
import { NoteCard } from './components/note-card'
import { Pagination } from './components/pagination'
import { SearchBar } from './components/search-bar'
import { SkeletonGrid } from './components/skeleton-cards'
import { useNotes } from './hooks/use-notes'
import { useTheme } from './hooks/use-theme'
import { useState } from 'react'

export function App() {
  const { theme, toggleTheme } = useTheme()
  const [createOpen, setCreateOpen] = useState(false)

  const {
    notes,
    total,
    page,
    totalPages,
    searchInput,
    isLoading,
    isCreating,
    setPage,
    setSearchInput,
    createNote,
    updateNote,
    deleteNote,
  } = useNotes()

  return (
    <div className='min-h-screen text-zinc-900 transition-colors dark:text-zinc-100'>
      <div className='mx-auto w-full max-w-5xl pb-[max(7rem,calc(env(safe-area-inset-bottom)+6rem))] pl-[max(1.75rem,env(safe-area-inset-left))] pr-[max(1.75rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))] md:px-4 md:pt-0 md:pb-24'>
        <Header
          total={total}
          page={page}
          totalPages={totalPages}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div className='mt-8 space-y-6'>
          <SearchBar value={searchInput} onChange={setSearchInput} />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {isLoading ? (
              <SkeletonGrid />
            ) : notes.length === 0 ? (
              <EmptyState hasSearch={Boolean(searchInput.trim())} />
            ) : (
              notes.map((note) => (
                <NoteCard
                  note={note}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                  key={note.id}
                />
              ))
            )}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <CreateNoteForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateNote={createNote}
        isCreating={isCreating}
      />
    </div>
  )
}
