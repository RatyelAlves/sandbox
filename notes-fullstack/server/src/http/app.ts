import fastify from 'fastify'
import { fastifyCors } from '@fastify/cors'
import { registerErrorHandler } from './lib/errors'
import { notesRoutes } from './routes/notes.routes'

export const app = fastify()

registerErrorHandler(app)

app.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})

app.register(notesRoutes)
