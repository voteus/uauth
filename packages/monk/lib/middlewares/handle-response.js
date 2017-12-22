const R = require('ramda')
const RA = require('ramda-adjunct')

/**
 * Util
 */

const {
  cond,
  identity,
  compose,
  map,
  merge,
  pick,
  omit,
  ifElse
} = R

const {
  isArray,
  isObj,
  resolveP,
  rejectP,
} = RA

const omitOid = omit([ '_id' ])

const strip = cond([
  [isArray, map(omitOid)],
  [isObj, omitOid],
  [R.T, identity]
])

function formatter () {
  return compose(resolveP, strip)
}

function handleResponse (context) {
  return next => (args, method) => {
    return next(args, method)
      .then(formatter())
  }
}

/**
 * Expose
 */

module.exports = handleResponse

