import fastify from 'fastify'
import mongoose from 'mongoose'

import apiRouter from './api'

async function main () {
  await mongoose.connect(process.env.MONGO_URI!, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  const app = fastify({
    logger: process.env.NODE_ENV === 'development' ? {
      prettyPrint: true
    } : true
  })
  const port = parseInt(process.env.PORT || '8080')

  app.register(apiRouter, { prefix: '/api' })

  app.get('/', (_, reply) => {
    reply.redirect('/api/doc/')
  })

  app.listen(
    port,
    process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0',
    (err) => {
      if (err) {
        throw err
      }

      console.log(`Go to http://localhost:${port}`)
    }
  )
}

if (require.main === module) {
  main()
}
