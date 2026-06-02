import { api } from '../lib/axios'
import type {
  CreateNoteInput,
  ListNotesParams,
  Note,
  NotesListResponse,
  UpdateNoteInput,
} from '../types/note'

export const notesApi = {
  async getAll(params: ListNotesParams = {}): Promise<NotesListResponse> {
    const response = await api.get<NotesListResponse>('/notes', { params })
    return response.data
  },

  async create(data: CreateNoteInput): Promise<Note> {
    const response = await api.post<Note>('/notes', data)
    return response.data
  },

  async update(id: string, data: UpdateNoteInput): Promise<Note> {
    const response = await api.put<Note>(`/notes/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/notes/${id}`)
  },
}
