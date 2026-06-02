export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
}

export interface NotesListResponse {
  notes: Note[]
  total: number
  page: number
  limit: number
}

export interface CreateNoteInput {
  title: string
  content: string
}

export interface UpdateNoteInput {
  title?: string
  content?: string
}

export interface ListNotesParams {
  page?: number
  limit?: number
  search?: string
}
