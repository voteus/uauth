import test from 'ava'

const Monk = require('../lib')

const db = new Monk('127.0.0.1/monk')
db.addMiddleware(require('monk-middleware-debug'))

test('ensure indexes', async t => {
  const options = {
    indexes: [
      {
        key: {
          id: 1,
          type: 1
        },
        unique: true
      }
    ]
  }

  const col = db.get('index-' + Date.now(), options)

  await col
    .indexes()
    .then(indexes => {
      const index = indexes.id_1_type_1
      t.not(index, undefined, 'accept indexes array')
    })

  await col
    .dropIndexes()
    .then(col.indexes)
    .then(indexes => {
      const index = indexes.id_1_type_1
      t.is(index, undefined, 'runs once on init')
    })

  const col2 = db.get('index-' + Date.now(), { type: 'B' })

  await col
    .insert({})
    .then(res => {
      t.pass('works fine with no indexes')
    })
})
