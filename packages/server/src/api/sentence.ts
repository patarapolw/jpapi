import { FastifyInstance } from 'fastify'

import { DbSentenceModel } from '../db/mongo'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.post('/match', {
    schema: {
      tags: ['sentence'],
      summary: 'Find for a given sentence',
      body: {
        type: 'object',
        required: ['entry'],
        properties: {
          entry: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            result: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  jpn: { type: 'string' },
                  eng: { type: 'string' },
                  tag: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      }
    }
  }, async (req) => {
    const { entry } = req.body

    const conds = [
      {
        $match: {
          text: entry,
          lang: 'jpn'
        }
      },
      {
        $lookup: {
          from: 'translation',
          localField: '_id',
          foreignField: 'sentenceId',
          as: 't'
        }
      },
      {
        $lookup: {
          from: 'sentence',
          localField: 't.translationId',
          foreignField: '_id',
          as: 's'
        }
      },
      {
        $unwind: '$s'
      },
      {
        $match: {
          's.lang': 'eng'
        }
      }
    ]

    const rData = await DbSentenceModel.aggregate([
      ...conds,
      {
        $project: {
          jpn: '$text',
          eng: '$s.text',
          tag: 1
        }
      }
    ])

    return {
      result: rData
    }
  })

  f.post('/q', {
    schema: {
      tags: ['sentence'],
      summary: 'Query for sentences',
      body: {
        type: 'object',
        required: ['cond'],
        properties: {
          cond: { type: 'object' },
          offset: { type: 'integer' },
          limit: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            result: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  jpn: { type: 'string' },
                  eng: { type: 'string' },
                  tag: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            count: { type: 'integer' },
            offset: { type: 'integer' },
            limit: { type: 'integer' }
          }
        }
      }
    }
  }, async (req) => {
    const { cond, offset = 0, limit = 10 } = req.body

    const conds = [
      {
        $match: {
          $and: [
            cond,
            { lang: 'jpn' }
          ]
        }
      },
      {
        $lookup: {
          from: 'translation',
          localField: '_id',
          foreignField: 'sentenceId',
          as: 't'
        }
      },
      {
        $lookup: {
          from: 'sentence',
          localField: 't.translationId',
          foreignField: '_id',
          as: 's'
        }
      },
      {
        $unwind: '$s'
      },
      {
        $match: {
          's.lang': 'eng'
        }
      }
    ]

    const [rData, rCount] = await Promise.all([
      DbSentenceModel.aggregate([
        ...conds,
        {
          $project: {
            jpn: '$text',
            eng: '$s.text'
          }
        },
        { $skip: offset },
        { $limit: limit },
        {
          $project: {
            jpn: '$text',
            eng: '$s.text',
            tag: 1
          }
        }
      ]),
      DbSentenceModel.aggregate([
        ...conds,
        { $count: 'count' }
      ])
    ])

    return {
      result: rData,
      count: (rCount[0] || {}).count || 0,
      offset,
      limit
    }
  })

  f.post('/random', {
    schema: {
      tags: ['sentence'],
      summary: 'Randomize a sentence',
      body: {
        type: 'object',
        properties: {
          cond: { type: 'object' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            result: {
              type: 'object',
              properties: {
                jpn: { type: 'string' },
                eng: { type: 'string' },
                tag: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    }
  }, async (req) => {
    const { cond = {} } = req.body
    const r = (await DbSentenceModel.aggregate([
      ...(cond ? [
        {
          $match: {
            $and: [
              cond,
              { lang: 'jpn' }
            ]
          }
        }
      ] : []),
      {
        $sample: { size: 1 }
      },
      {
        $lookup: {
          from: 'translation',
          localField: '_id',
          foreignField: 'sentenceId',
          as: 't'
        }
      },
      {
        $lookup: {
          from: 'sentence',
          localField: 't.translationId',
          foreignField: '_id',
          as: 's'
        }
      },
      {
        $match: {
          $or: [
            { 's.lang': 'eng' },
            { 's.lang': { $exists: false } }
          ]
        }
      },
      {
        $unwind: {
          path: '$s',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          jpn: '$text',
          eng: '$s.text',
          tag: 1
        }
      }
    ]))

    return {
      result: r[0]
    }
  })

  next()
}
