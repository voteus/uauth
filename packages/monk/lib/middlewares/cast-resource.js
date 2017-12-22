const R = require('ramda')
const RA = require('ramda-adjunct')

const {
  cond,
  identity,
  compose,
  map,
  merge
} = R

const {
  isArray,
  isObj
} = RA

const allP = Promise.all.bind(Promise)

function castResource (context) {
  const { collection } = context

  return next => async (args, method) => {
    const data = await collection.cast(args.data)
    const newArgs = merge(args, { data })

    return next(newArgs, method)
  }
}

module.exports = castResource
