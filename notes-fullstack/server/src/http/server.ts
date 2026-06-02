import { app } from './app'
import { prisma } from './lib/prisma'

const port = Number(process.env.PORT) || 8080

async function start() {
  try {
    await app.listen({
      port,
      host: '0.0.0.0',
    })

    console.log(`HTTP server run on http://localhost:${port}`)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

async function shutdown() {
  await app.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

start()
