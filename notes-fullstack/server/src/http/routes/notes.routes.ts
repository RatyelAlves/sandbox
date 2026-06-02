import type { FastifyInstance } from 'fastify'
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from '../controllers/notes.controller'

export async function notesRoutes(app: FastifyInstance) {
  app.get('/notes', getNotes)
  app.post('/notes', createNote)
  app.put('/notes/:id', updateNote)
  app.delete('/notes/:id', deleteNote)
}
