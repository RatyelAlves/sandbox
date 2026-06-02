import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'
import { serializeNote } from '../lib/errors'
import {
  createNoteSchema,
  listNotesQuerySchema,
  noteIdParamsSchema,
  updateNoteSchema,
} from '../schemas/note.schema'

export async function getNotes(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { page, limit, search } = listNotesQuerySchema.parse(request.query)

  const where = search
    ? {
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
        ],
      }
    : undefined

  try {
    const [notes, total] = await Promise.all([
      prisma.notes.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notes.count({ where }),
    ])

    return reply.status(200).send({
      notes: notes.map(serializeNote),
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error(error)
    return reply.status(500).send({ message: 'Erro ao buscar notas.' })
  }
}

export async function createNote(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { title, content } = createNoteSchema.parse(request.body)

  try {
    const note = await prisma.notes.create({
      data: { title, content },
    })

    return reply.status(201).send(serializeNote(note))
  } catch (error) {
    console.error(error)
    return reply.status(500).send({ message: 'Erro ao criar nota.' })
  }
}

export async function updateNote(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = noteIdParamsSchema.parse(request.params)
  const data = updateNoteSchema.parse(request.body)

  try {
    const note = await prisma.notes.update({
      where: { id },
      data,
    })

    return reply.status(200).send(serializeNote(note))
  } catch (error) {
    console.error(error)
    return reply.status(404).send({ message: 'Nota não encontrada.' })
  }
}

export async function deleteNote(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = noteIdParamsSchema.parse(request.params)

  try {
    await prisma.notes.delete({
      where: { id },
    })

    return reply.status(200).send({ message: 'Nota deletada com sucesso.' })
  } catch (error) {
    console.error(error)
    return reply.status(404).send({ message: 'Nota não encontrada.' })
  }
}
