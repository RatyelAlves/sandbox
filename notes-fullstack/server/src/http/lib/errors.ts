import { ZodError } from 'zod'
import type { FastifyInstance } from 'fastify'

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: 'Dados inválidos.',
        errors: error.flatten().fieldErrors,
      })
    }

    console.error(error)
    return reply.status(500).send({ message: 'Erro interno do servidor.' })
  })
}

export function serializeNote(note: {
  id: string
  title: string
  content: string
  createdAt: Date
}) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
  }
}
