import { FastifyInstance } from 'fastify'
import swagger from 'fastify-oas'
import cors from 'fastify-cors'
import rateLimit from 'fastify-rate-limit'

import libRouter from './lib'
import sentenceRouter from './sentence'
import vocabRouter from './vocab'
import kanjiRouter from './kanji'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.register(swagger, {
    routePrefix: '/doc',
    swagger: {
      info: {
        title: 'Swagger API',
        version: '0.1.0'
      },
      consumes: ['application/json'],
      produces: ['application/json'],
      servers: [
        {
          url: 'https://jpapi.polv.cc',
          description: 'Online server'
        },
        {
          url: 'http://localhost:8080',
          description: 'Local server'
        }
      ]
    },
    exposeRoute: true
  })

  f.register(cors)
  f.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  f.register(libRouter, { prefix: '/lib' })
  f.register(sentenceRouter, { prefix: '/sentence' })
  f.register(vocabRouter, { prefix: '/vocab' })
  f.register(kanjiRouter, { prefix: '/kanji' })

  next()
}
