const R = require('ramda')
const RA = require('ramda-adjunct')

const {
  assoc,
  merge,
  reduce,
  toPairs,
  pick
} = R

const {
  isString,
  isNilOrEmpty
} = RA

function formatRefs (query) {
  const refs = query.refs

  if (isNilOrEmpty(refs)) return query

  delete query.refs

  const getRef = pick(['id', 'type'])

  const one = (q, pair) => {
    const [ name, value ] = pair
    return assoc(`refs.${name}`, getRef(value), q)
  }

  return reduce(one, query, toPairs(refs))
}

function formatQuery (context) {
  const { collection } = context

  return next => async (args, method) => {
    const { type } = collection

    if (!args.query) {
      const query = { type }
      return next(merge(args, { query }), method)
    }

    if (isString(args.query)) {
      const query = {
        type,
        id: args.query
      }
      return next(merge(args, { query }), method)
    }

    const { query } = args

    query.type = query.type || type

    args.query = formatRefs(query)

    return next(args, method)
  }
}

module.exports = formatQuery
