import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useDebounce } from './use-debounce'
import { getErrorMessage } from '../lib/axios'
import { notesApi } from '../services/notes-api'
import type { CreateNoteInput, Note, UpdateNoteInput } from '../types/note'

const NOTES_PER_PAGE = 9

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const debouncedSearch = useDebounce(searchInput, 350)
  const totalPages = Math.max(1, Math.ceil(total / NOTES_PER_PAGE))

  useEffect(() => {
    setSearch(debouncedSearch)
    setPage(1)
  }, [debouncedSearch])

  const loadNotes = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await notesApi.getAll({
        page,
        limit: NOTES_PER_PAGE,
        search: search.trim() || undefined,
      })

      setNotes(data.notes)
      setTotal(data.total)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  const createNote = useCallback(async (input: CreateNoteInput) => {
    const content = input.content.trim()

    if (!content) {
      toast.error('Digite o conteúdo da nota.')
      throw new Error('Conteúdo vazio')
    }

    setIsCreating(true)

    try {
      await notesApi.create({
        title: input.title.trim(),
        content,
      })

      toast.success('Nota criada com sucesso.')
      setSearchInput('')
      setPage(1)

      const data = await notesApi.getAll({
        page: 1,
        limit: NOTES_PER_PAGE,
      })

      setNotes(data.notes)
      setTotal(data.total)
    } catch (error) {
      toast.error(getErrorMessage(error))
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [])

  const updateNote = useCallback(async (id: string, input: UpdateNoteInput) => {
    const content = input.content?.trim()

    if (input.content !== undefined && !content) {
      toast.error('O conteúdo não pode ficar vazio.')
      throw new Error('Conteúdo vazio')
    }

    try {
      const note = await notesApi.update(id, {
        title: input.title?.trim(),
        content,
      })

      setNotes((current) => current.map((item) => (item.id === id ? note : item)))
      toast.success('Nota atualizada com sucesso.')
    } catch (error) {
      toast.error(getErrorMessage(error))
      throw error
    }
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    try {
      await notesApi.delete(id)

      const newTotal = Math.max(0, total - 1)
      const newTotalPages = Math.max(1, Math.ceil(newTotal / NOTES_PER_PAGE))
      const nextPage = Math.min(page, newTotalPages)

      setTotal(newTotal)

      if (nextPage !== page) {
        setPage(nextPage)
      } else {
        setNotes((current) => current.filter((note) => note.id !== id))
      }

      toast.success('Nota apagada com sucesso.')
    } catch (error) {
      toast.error(getErrorMessage(error))
      await loadNotes()
      throw error
    }
  }, [loadNotes, page, total])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  return {
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
    reloadNotes: loadNotes,
  }
}
