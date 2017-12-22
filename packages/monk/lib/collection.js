const monk = require('monk')

const R = require('ramda')
const RA = require('ramda-adjunct')

const createError = require('http-errors')

const schema = require('@local/schema-resources')

const {
  pick,
  when,
  isNil,
  map,
  assoc,
  reduce,
  toPairs
} = R

const {
  rejectP,
} = RA

const ensureOk = when(
  isNil,
  () => rejectP(createError(404))
)

const allP = Promise.all.bind(Promise)

class Collection extends monk.Collection {
  constructor (db, name, opts = {}) {
    const type = opts.type || name
    const indexes = opts.indexes || []

    delete opts.type
    delete opts.indexes

    super(db, name, opts)

    this.type = type
    this._indexes = indexes

    this.cast = this.cast.bind(this)
  }

  cast (data = {}) {
    const context = pick(['type'], this)

    return schema.validate(data, { context })
  }

  findOne (...args) {
    return super
      .findOne(...args)
      .then(ensureOk)
  }

  findOneAndDelete (...args) {
    return super
      .findOneAndDelete(...args)
      .then(ensureOk)
  }

  findByRefs (refs, options) {
    const one = (q, pair) => {
      const [ name, value ] = pair
      return assoc(`refs.${name}`, value, q)
    }

    const query = reduce(one, {}, toPairs(refs))

    return this.find(query)
  }
}

module.exports = Collection
