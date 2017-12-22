import test from 'ava'

const Monk = require('../lib')

const db = new Monk('127.0.0.1/monk')
db.addMiddleware(require('monk-middleware-debug'))

const users = db.get('users-' + Date.now(), { type: 'users' })
const indexCol = db.get('index-' + Date.now())

test.after(() => {
  return users.drop()
})

test('cast', async t => {
  await users
    .cast({ body: 'a', name: 'b' })
    .then(res => {
      t.is(typeof res.id, 'string', 'ensure id')
      t.is(res.type, 'users', 'use default type')
      t.is(res.body, 'a', 'use body')
      t.is(res.name, undefined, 'omit extra')
      t.is(res.refs, undefined, 'omit empty refs')
    })

  await users
    .cast({ id: 'b', type: 'bots' })
    .then(res => {
      t.is(res.id, 'b', 'use id')
      t.is(res.type, 'bots', 'use type')
      t.is(res.body, undefined, 'omit empty body')
    })
})

test('insert', async t => {
  await users
    .insert({ body: 'a' })
    .then(doc => {
      t.is(doc._id, undefined, 'skip _id')

      t.is(typeof doc.id, 'string', 'ensure id')
      t.is(doc.type, 'users', 'use default type')
    })

  await users
    .insert({ id: 'b', type: 'B', body: 'b' })
    .then(doc => {
      t.is(doc._id, undefined, 'skip _id')

      t.is(doc.id, 'b', 'use provided id')
      t.is(doc.type, 'B', 'use provided type')
    })

  await users
    .insert([{ body: 'c' }, { body: 'd' }])
    .then(docs => {
      t.true(Array.isArray(docs), 'res arr if inserted arr')
      t.is(docs.length, 2)
      docs.forEach(res => {
        t.is(typeof res.id, 'string', 'multi-cast w/ id')
        t.is(typeof res.type, 'string', 'multi-cast w/ type')
        t.is(typeof res.body, 'string', 'multi-cast w/ body')
      })
    })

  await users
    .insert([])
    .then(docs => {
      t.true(Array.isArray(docs), 'not throw on empty arr')
      t.is(docs.length, 0)
    })
})

test('findOne', async t => {
  const res = await users.insert({ body: 'a' })

  const resNotFound = users.findOne({ nonExistingField: true })
  await t.throws(resNotFound, /not found/gi, 'throws on null')

  await users
    .findOne()
    .then(() => t.pass('findOne(undefined) works'))

  await users
    .findOne(res.id)
    .then(() => t.pass('findOne(id) works'))

  await users
    .findOne(res.id)
    .then(res => {
      t.is(res._id, undefined, 'skip _id')
      t.is(res.type, 'users', 'get type')
    })

  await users
    .findOne(res.id, 'body')
    .then(res => {
      t.is(res.body, 'a', 'provide selected fields')
      t.is(res.id, undefined, 'skip not-selected fields')
      t.is(res.type, undefined, 'skip not-selected fields')
    })
})

test('find', async t => {
  await users
    .insert({ body: 'a' })

  await users
    .find()
    .then(docs => {
      docs.forEach(doc => {
        t.is(doc._id, undefined, 'skip _id')
      })
    })

  //

  await users
    .insert([
      { meta: 'type' },
      { meta: 'type', type: 'other' },
      { meta: 'type', type: 'other' }
    ])

  await users
    .find({ meta: 'type' })
    .then(docs => {
      t.is(docs.length, 1, 'query by default type')
    })

  await users
    .find({ meta: 'type', type: 'other' })
    .then(docs => {
      t.is(docs.length, 2, 'use provided type')
    })

  //

  await users
    .insert([
      { meta: { a: 1 } },
      { meta: { a: 2 } }
    ])

  await users
    .find({ 'meta.a': 1 })
    .then(docs => {
      t.is(docs.length, 1, 'with nested query')
      t.is(docs[0].meta.a, 1)
    })

  // nested array

  await users
    .insert([
      { body: [{ a: 1 }] },
      { body: [{ a: 2 }] }
    ])

  await users
    .find({ 'body.a': 1 })
    .then(docs => {
      t.is(docs.length, 1, 'with nested array query')
      t.is(docs[0].body[0].a, 1)
    })

  //

  await users
    .insert([
      { meta: 'sort', body: { a: 1, b: 2 } },
      { meta: 'sort', body: { a: 1, b: 1 } }
    ])

  await users
    .find({ meta: 'sort' }, { sort: '-body.a body.b' })
    .then(docs => {
      t.is(docs[0].body.b, 1, 'should sort')
      t.is(docs[1].body.b, 2, 'should sort')
    })

  //

  const refs = {
    a: { id: 'a', type: 'a' },
    b: { id: 'b', type: 'b' }
  }

  await users
    .insert([
      { meta: 'findByRefs', refs },
      { meta: 'findByRefs', refs: { a: refs.a } },
    ])

  await users
    .find({
      meta: 'findByRefs',
      refs: {
        a: {
          id: 'a',
          type: 'a',
          meta: 'a'
        }
      }
    })
    .then(docs => {
      t.is(docs.length, 2, 'find by refs')
    })
})

test('count', async t => {
  await users
    .count({ meta: 'count' })
    .then(count => t.is(count, 0), 'should count')

  await users
    .insert([
      { meta: 'count' },
      { meta: 'count' },
      { meta: 'count' },
      { meta: 'count' }
    ])

  await users
    .count({ meta: 'count' })
    .then(count => t.is(count, 4, 'should count'))

  await users
    .count({ meta: 'count' }, { limit: 2 })
    .then(count => t.is(count, 2, 'not ignore options'))
})

test('remove', async t => {
  await users
    .insert([
      { meta: 'remove' },
      { meta: 'remove' }
    ])

  await users
    .remove({ meta: 'remove' })

  await users
    .count({ meta: 'remove' })
    .then(count => t.is(count, 0, 'remove all'))
})

test('findOneAndDelete', async t => {
  await users
    .insert([
      { meta: 'findOneAndDelete' },
      { meta: 'findOneAndDelete' }
    ])

  await users
    .findOneAndDelete({ meta: 'findOneAndDelete' })
    .then(doc => {
      t.is(doc._id, undefined, 'skip _id')
      t.is(doc.meta, 'findOneAndDelete', 'proper doc')
    })

  await users
    .count({ meta: 'findOneAndDelete' })
    .then(count => t.is(count, 1, 'delete only one'))

  //

  await users
    .findOneAndDelete({ extra: true })
    .then(() => t.fail('throw if found nothing'))
    .catch(err => t.is(err.status, 404, 'throw 404'))
})

test('createIndex', async t => {
  await indexCol
    .createIndex('name.first')
    .then(indexCol.indexes)
    .then(indexes => {
      const index = indexes['name.first_1']
      t.not(index, undefined, 'accept a field string')
    })

  await indexCol
    .createIndex({ location: '2dsphere' })
    .then(indexCol.indexes)
    .then(indexes => {
      const index = indexes.location_2dsphere
      t.not(index, undefined, 'object argument')
    })

  await indexCol
    .createIndex('name last')
    .then(indexCol.indexes)
    .then(indexes => {
      const index = indexes.name_1_last_1
      t.not(index, undefined, 'space delimited compound')
    })

  await indexCol
    .createIndex(['nombre', 'apellido'])
    .then(indexCol.indexes)
    .then(indexes => {
      const index = indexes.nombre_1_apellido_1
      t.not(index, undefined, 'array compound indexes')
    })

  await indexCol
    .createIndex({ up: 1, down: -1 })
    .then(indexCol.indexes)
    .then(indexes => {
      const index = indexes['up_1_down_-1']
      t.not(index, undefined, 'object compound indexes')
    })

  await indexCol
    .createIndex({ woot: 1 }, { unique: true })
    .then(indexCol.indexes)
    .then(indexes => {
      const index = indexes.woot_1
      t.not(index, undefined, 'accept options')
    })
})

test('index', async t => {
  await indexCol
    .index('name.first')
    .then(indexCol.indexes)
    .then(indexes => {
      const index = indexes['name.first_1']
      t.not(index, undefined, 'accept a field string')
    })
})

test('dropIndex', async t => {
  await indexCol
    .index('name2.first')
    .then(indexCol.indexes)
    .then(indexes => t.truthy(indexes['name2.first_1']))

  await indexCol
    .dropIndex('name2.first')
    .then(indexCol.indexes)
    .then(indexes => {
      t.is(indexes['name2.first_1'], undefined, 'field string')
    })

  //

  await indexCol
    .index('name2 last')
    .then(indexCol.indexes)
    .then(indexes => t.truthy(indexes.name2_1_last_1))

  await indexCol
    .dropIndex('name2 last')
    .then(indexCol.indexes)
    .then(indexes => {
      t.is(indexes.name2_1_last_1, undefined, 'space delimited compound')
    })

  await indexCol
    .index(['nom2', 'ape2'])
    .then(indexCol.indexes)
    .then(indexes => t.truthy(indexes.nom2_1_ape2_1))

  await indexCol
    .dropIndex(['nom2', 'ape2'])
    .then(indexCol.indexes)
    .then(indexes => {
      t.is(indexes.nom2_1_ape2_1, undefined, 'array compound')
    })

  await indexCol
    .index({ up2: 1, down: -1 })
    .then(indexCol.indexes)
    .then(indexes => t.truthy(indexes['up2_1_down_-1']))

  await indexCol
    .dropIndex({ up2: 1, down: -1 })
    .then(indexCol.indexes)
    .then(indexes => {
      t.is(indexes['up2_1_down_'], undefined, 'object compound')
    })
})

test('dropIndexes', async t => {
  const col = db.get('indexDrop-' + Date.now())

  await col
    .index({ up2: 1, down: -1 })
    .then(col.indexes)
    .then(indexes => t.truthy(indexes['up2_1_down_-1']))

  await col
    .dropIndexes()
    .then(col.indexes)
    .then(indexes => {
      t.is(indexes['up2_1_down_'], undefined, 'drop all')
    })
})

/**
 * Original tests
 */

test.skip('find > should return the raw cursor', (t) => {
  const query = { stream: 3 }
  return users.insert([{ stream: 3 }, { stream: 3 }, { stream: 3 }, { stream: 3 }]).then(() => {
    return users.find(query, {rawCursor: true})
      .then((cursor) => {
        t.truthy(cursor.close)
        t.truthy(cursor.pause)
        t.truthy(cursor.resume)
        cursor.close()
      })
  })
})

test.skip('find > should work with streaming', (t) => {
  const query = { stream: 1 }
  let found = 0
  return users.insert([{ stream: 1 }, { stream: 1 }, { stream: 1 }, { stream: 1 }]).then(() => {
    return users.find(query)
      .each((doc) => {
        t.is(doc.stream, 1)
        found++
      })
      .then(() => {
        t.is(found, 4)
      })
  })
})

test.skip('find > should work with streaming option', (t) => {
  const query = { stream: 2 }
  let found = 0
  return users.insert([{ stream: 2 }, { stream: 2 }, { stream: 2 }, { stream: 2 }]).then(() => {
    return users.find(query, { stream: true })
      .each((doc) => {
        t.is(doc.stream, 2)
        found++
      })
      .then(() => {
        t.is(found, 4)
      })
  })
})

test.skip('find > should work with streaming option without each', (t) => {
  const query = { stream: 5 }
  let found = 0
  return users.insert([{ stream: 5 }, { stream: 5 }, { stream: 5 }, { stream: 5 }]).then(() => {
    return users.find(query, {
      stream (doc) {
        t.is(doc.stream, 5)
        found++
      }
    })
    .then(() => {
      t.is(found, 4)
    })
  })
})

test.skip('find > should allow stream cursor destroy', (t) => {
  const query = { cursor: { $exists: true } }
  let found = 0
  return users.insert([{ cursor: true }, { cursor: true }, { cursor: true }, { cursor: true }]).then(() => {
    return users.find(query)
      .each((doc, {close}) => {
        t.not(doc.cursor, null)
        found++
        if (found === 2) close()
      })
      .then(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            t.is(found, 2)
            resolve()
          }, 100)
        })
      })
  })
})

test.skip('find > should allow stream cursor destroy even when paused', (t) => {
  const query = { cursor: { $exists: true } }
  let found = 0
  return users.insert([{ cursor: true }, { cursor: true }, { cursor: true }, { cursor: true }]).then(() => {
    return users.find(query)
      .each((doc, {close, pause, resume}) => {
        pause()
        t.not(doc.cursor, null)
        found++
        if (found === 2) return close()
        resume()
      })
      .then(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            t.is(found, 2)
            resolve()
          }, 100)
        })
      })
  })
})

test.skip('find > stream pause and continue', (t) => {
  const query = { stream: 4 }
  return users.insert([{ stream: 4 }, { stream: 4 }, { stream: 4 }, { stream: 4 }]).then(() => {
    const start = Date.now()
    let index = 0
    return users.find(query)
      .each((doc, {pause, resume}) => {
        pause()
        const duration = Date.now() - start
        t.true(duration > index * 1000)
        setTimeout(() => {
          index += 1
          resume()
        }, 1000)
      })
      .then(() => {
        t.is(index, 4)
        const duration = Date.now() - start
        t.true(duration > 4000)
      })
  })
})

test.skip.cb('find > stream callback', (t) => {
  const query = { stream: 3 }
  users.insert([{ stream: 3 }, { stream: 3 }, { stream: 3 }, { stream: 3 }]).then(() => {
    return users.find(query, t.end)
      .each((doc) => {
        t.not(doc.a, null)
      })
  })
})

test.skip('group > should work', (t) => {
  return users.insert([{ group: true }, { group: true }]).then(() => {
    return users.group(
      { group: true },
      {},
      { count: 0 },
      function (obj, prev) {
        return prev.count++
      }
    )
  }).then(([group1, group2]) => {
    t.is(group1.group, null)
    t.true(group2.group)
    t.is(group2.count, 2)
  })
})

test.skip.cb('group > callback', (t) => {
  users.group(
    { group: true },
    {},
    { count: 0 },
    function (obj, prev) {
      prev.count++
    },
    function (x) { return x },
    true,
    t.end
  )
})

test.skip('distinct', (t) => {
  return users.insert([{ distinct: 'a' }, { distinct: 'a' }, { distinct: 'b' }]).then(() => {
    return users.distinct('distinct')
  }).then((docs) => {
    t.deepEqual(docs, ['a', 'b'])
  })
})

test.skip('distinct with options', (t) => {
  return users.insert([{ distinct2: 'a' }, { distinct2: 'a' }, { distinct2: 'b' }]).then(() => {
    return users.distinct('distinct2', {})
  }).then((docs) => {
    t.deepEqual(docs, ['a', 'b'])
  })
})

test.skip.cb('distinct > with options callback', (t) => {
  users.distinct('distinct', {}, t.end)
})

test.skip.cb('distinct > callback', (t) => {
  users.distinct('distinct', t.end)
})

test.skip('update > should update', (t) => {
  return users.insert({ d: 'e' }).then((doc) => {
    return users.update({ _id: doc._id }, { $set: { d: 'f' } }).then(() => {
      return users.findOne(doc._id)
    })
  }).then((doc) => {
    t.is(doc.d, 'f')
  })
})

test.skip('update > should update with 0', (t) => {
  return users.insert({ d: 'e' }).then((doc) => {
    return users.update({ _id: doc._id }, { $set: { d: 0 } }).then(() => {
      return users.findOne(doc._id)
    })
  }).then((doc) => {
    t.is(doc.d, 0)
  })
})

test.skip.cb('update > callback', (t) => {
  users.update({ d: 'e' }, { $set: { d: 'f' } }, t.end)
})

test.skip('update > should update with an objectid', (t) => {
  return users.insert({ d: 'e' }).then((doc) => {
    return users.update(doc._id, { $set: { d: 'f' } }).then(() => {
      return users.findOne(doc._id)
    })
  }).then((doc) => {
    t.is(doc.d, 'f')
  })
})

test.skip('update > should update with an objectid (string)', (t) => {
  return users.insert({ d: 'e' }).then((doc) => {
    return users.update(doc._id.toString(), { $set: { d: 'f' } }).then(() => {
      return users.findOne(doc._id)
    })
  }).then((doc) => {
    t.is(doc.d, 'f')
  })
})

test.skip('findOneAndUpdate > should update a document and return it', (t) => {
  return users.insert({ name: 'Jack' }).then((doc) => {
    return users.findOneAndUpdate({ name: 'Jack' }, { name: 'Jack4' })
  }).then((doc) => {
    t.is(doc.name, 'Jack4')
  })
})

test.skip('findOneAndUpdate > should return null if found nothing', (t) => {
  return users.findOneAndUpdate({ name: 'Jack5' }, { name: 'Jack6' })
    .then((doc) => {
      t.is(doc, null)
    })
})

test.skip.cb('findOneAndUpdate > callback', (t) => {
  users.insert({ name: 'Jack2' }).then((doc) => {
    users.findOneAndUpdate({ name: 'Jack2' }, { name: 'Jack3' }, (err, doc) => {
      t.is(err, null)
      t.is(doc.name, 'Jack3')
      t.end()
    })
  })
})

test.skip('aggregate > should fail properly', (t) => {
  return users.aggregate().catch(() => {
    t.pass()
  })
})

test.skip.cb('aggregate > should fail properly with callback', (t) => {
  users.aggregate(undefined, function (err) {
    t.truthy(err)
    t.end()
  })
})

test.skip('aggregate > should work in normal case', (t) => {
  return users.aggregate([{$group: {_id: null, maxWoot: { $max: '$woot' }}}]).then((res) => {
    t.true(Array.isArray(res))
    t.is(res.length, 1)
  })
})

test.skip('aggregate > should work with option', (t) => {
  return users.aggregate([{$group: {_id: null, maxWoot: { $max: '$woot' }}}], { explain: true }).then((res) => {
    t.true(Array.isArray(res))
    t.is(res.length, 1)
  })
})

test.skip.cb('aggregate > callback', (t) => {
  users.aggregate([{$group: {_id: null, maxWoot: { $max: '$woot' }}}], t.end)
})

test.skip('bulkWrite', (t) => {
  return users.bulkWrite([
    { insertOne: { document: { bulkWrite: 1 } } }
  ]).then((r) => {
    t.is(r.nInserted, 1)
  })
})

test.skip.cb('bulkWrite > callback', (t) => {
  users.bulkWrite([
    { insertOne: { document: { bulkWrite: 2 } } }
  ], t.end)
})

test.skip('should allow defaults', (t) => {
  return users.insert([{ f: true }, { f: true }, { g: true }, { g: true }]).then(() => {
    return users.update({}, { $set: { f: 'g' } })
  }).then(() => {
    users.options.safe = false
    users.options.multi = false
    return users.update({}, { $set: { g: 'h' } })
  }).then(({n}) => {
    t.true(n && n <= 1)
  }).then(() => {
    users.options.safe = true
    users.options.multi = true
    return users.update({}, { $set: { g: 'i' } }, { safe: false, multi: false })
  }).then(({n}) => {
    t.true(n && n <= 1)
  })
})

test.skip('drop > should not throw when dropping an empty db', (t) => {
  return db.get('dropDB-' + Date.now()).drop().then(() => t.pass()).catch(() => t.fail())
})

test.skip.cb('drop > callback', (t) => {
  db.get('dropDB2-' + Date.now()).drop(t.end)
})

test.skip('caching collections', (t) => {
  const collectionName = 'cached-' + Date.now()
  t.is(db.get(collectionName), db.get(collectionName))
})

test.skip('not caching collections', (t) => {
  const collectionName = 'cached-' + Date.now()
  t.not(db.get(collectionName, {cache: false}), db.get(collectionName, {cache: false}))
})

test.skip('geoHaystackSearch', (t) => {
  return users.ensureIndex({loc: 'geoHaystack', type: 1}, {bucketSize: 1})
    .then(() => users.insert([{a: 1, loc: [50, 30]}, {a: 1, loc: [30, 50]}]))
    .then(() => users.geoHaystackSearch(50, 50, {search: {a: 1}, limit: 1, maxDistance: 100}))
    .then((r) => {
      t.is(r.length, 1)
    })
})

test.skip.cb('geoHaystackSearch > callback', (t) => {
  users.ensureIndex({loc: 'geoHaystack', type: 1}, {bucketSize: 1})
    .then(() => users.insert([{a: 1, loc: [50, 30]}, {a: 1, loc: [30, 50]}]))
    .then(() => users.geoHaystackSearch(50, 50, {search: {a: 1}, maxDistance: 100}, t.end))
})

test.skip('geoNear', (t) => {
  return users.ensureIndex({loc2: '2d'})
    .then(() => users.insert([{a: 1, loc2: [50, 30]}, {a: 1, loc2: [30, 50]}]))
    .then(() => users.geoNear(50, 50, {query: {a: 1}, num: 1}))
    .then((r) => {
      t.is(r.length, 1)
    })
})

test.skip.cb('geoNear > callback', (t) => {
  users.ensureIndex({loc2: '2d'})
    .then(() => users.insert([{a: 1, loc2: [50, 30]}, {a: 1, loc2: [30, 50]}]))
    .then(() => users.geoNear(50, 50, t.end))
})

test.skip('mapReduce', (t) => {
  // Map function
  const map = function () { emit(this.user_id, 1) } // eslint-disable-line
  // Reduce function
  const reduce = function (k, vals) { return 1 }
  return users.insert([{user_id: 1}, {user_id: 2}])
    .then(() => users.mapReduce(map, reduce, {out: {replace: 'tempCollection'}}))
    .then((collection) => collection.findOne({'_id': 1}))
    .then((r) => {
      t.is(r.value, 1)
    })
})

test.skip.cb('mapReduce > callback', (t) => {
  // Map function
  const map = function () { emit(this.user_id, 1) } // eslint-disable-line
  // Reduce function
  const reduce = function (k, vals) { return 1 }
  users.mapReduce(map, reduce, {out: {replace: 'tempCollection'}}, t.end)
})

test.skip('stats', (t) => {
  return users.stats().then((res) => {
    t.truthy(res)
  })
})

test.skip.cb('stats > callback', (t) => {
  users.stats(t.end)
})
