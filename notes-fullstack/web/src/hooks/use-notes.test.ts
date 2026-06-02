import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNotes } from './use-notes'
import { notesApi } from '../services/notes-api'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useNotes', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    vi.spyOn(notesApi, 'getAll').mockResolvedValue({
      notes: [
        {
          id: '1',
          title: 'Teste',
          content: 'Conteúdo',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 9,
    })
  })

  it('carrega notas ao montar', async () => {
    const { result } = renderHook(() => useNotes())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.notes).toHaveLength(1)
    expect(notesApi.getAll).toHaveBeenCalled()
  })

  it('remove nota da lista após delete', async () => {
    vi.spyOn(notesApi, 'delete').mockResolvedValue()

    const { result } = renderHook(() => useNotes())

    await waitFor(() => {
      expect(result.current.notes).toHaveLength(1)
    })

    await act(async () => {
      await result.current.deleteNote('1')
    })

    expect(result.current.notes).toHaveLength(0)
    expect(notesApi.delete).toHaveBeenCalledWith('1')
  })
})
