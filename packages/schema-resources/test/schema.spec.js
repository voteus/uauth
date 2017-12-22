import test from 'ava'

import schema from '..'

test('identifier', async t => {
  await schema
    .validate({ id: 'a', type: 'chars' })
    .then(res => {
      t.is(res.id, 'a', 'provided id')
      t.is(res.type, 'chars', 'provided type')
    })

  await schema
    .validate({})
    .then(res => {
      t.is(typeof res.id, 'string', 'generate id')
      t.is(res.type, 'entities', 'default type')
    })

  await schema
    .validate({ id: 'b', stats: 1 })
    .then(res => {
      t.is(res.id, 'b')
      t.is(res.stats, undefined, 'strip extra')
    })

  await schema
    .validate({}, { context: { type: 'things' } })
    .then(res => {
      t.is(typeof res.id, 'string')
      t.is(res.type, 'things', 'context type')
    })
})

test('refs', async t => {
  await schema
    .validate({
      refs: {
        a: { id: 'a', type: 'A', extra: 'x' }
      }
    })
    .then(res => {
      const { a } = res.refs

      t.is(a.id, 'a')
      t.is(a.type, 'A')
      t.is(a.extra, undefined, 'skip extra')
    })

  await schema
    .validate({
      refs: {
        b: [
          { id: 'b', type: 'B', extra: 'y' }
        ]
      }
    })
    .then(res => {
      const { b } = res.refs

      t.true(Array.isArray(b), 'handle arrays')

      t.is(b[0].id, 'b')
      t.is(b[0].type, 'B')
      t.is(b[0].extra, undefined, 'skip extra')
    })
})

test('errors', async t => {
  await t.throws(schema.validate({ refs: 'exo' }))
    .then(err => {
      t.is(err.status, 422, 'http ready errors')
      t.not(err.source, undefined)
    })
})

test('resource', async t => {
  await schema
    .validate({ id: 'a', type: 'chars' })
    .then(res => {
      t.is(res.id, 'a', 'provided id')
      t.is(res.type, 'chars', 'provided type')
    })

  await schema
    .validate({
      id: 'b',
      body: { b: 1 },
      meta: { b: 2 },
      stats: 2
    })
    .then(res => {
      t.is(res.id, 'b')
      t.deepEqual(res.body, { b: 1 }, 'keep body')
      t.deepEqual(res.meta, { b: 2 }, 'keep meta')
      t.is(res.stats, undefined, 'strip extra')
    })
})

test('resources array', async t => {
  await schema
    .validate([
      { id: 'a', type: 'chars' },
      { id: 'b' }
    ])
    .then(docs => {
      t.is(docs.length, 2, 'support array of resources')
    })
})
