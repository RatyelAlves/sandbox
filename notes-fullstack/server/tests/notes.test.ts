import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { app } from '../src/http/app'
import { prisma } from '../src/http/lib/prisma'

describe('Notes API', () => {
  let createdNoteId = ''

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    if (createdNoteId) {
      await prisma.notes.delete({ where: { id: createdNoteId } }).catch(() => undefined)
    }

    await app.close()
    await prisma.$disconnect()
  })

  it('cria uma nota e retorna os dados completos', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/notes',
      payload: {
        title: 'Nota teste',
        content: 'Conteúdo da nota de teste',
      },
    })

    expect(response.statusCode).toBe(201)

    const body = response.json()
    createdNoteId = body.id

    expect(body.title).toBe('Nota teste')
    expect(body.content).toBe('Conteúdo da nota de teste')
    expect(body.createdAt).toBeTruthy()
  })

  it('lista notas com paginação', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/notes?page=1&limit=5',
    })

    expect(response.statusCode).toBe(200)

    const body = response.json()
    expect(Array.isArray(body.notes)).toBe(true)
    expect(body.page).toBe(1)
    expect(body.limit).toBe(5)
    expect(typeof body.total).toBe('number')
  })

  it('atualiza uma nota existente', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/notes/${createdNoteId}`,
      payload: {
        title: 'Nota atualizada',
        content: 'Conteúdo atualizado',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().title).toBe('Nota atualizada')
  })

  it('rejeita criação com conteúdo vazio', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/notes',
      payload: { title: 'Sem conteúdo', content: '' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('deleta uma nota existente', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/notes/${createdNoteId}`,
    })

    expect(response.statusCode).toBe(200)
    createdNoteId = ''
  })
})
