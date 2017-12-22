const RA = require('ramda-adjunct')

const createError = require('http-errors')

/**
 * Util
 */

const {
  rejectP
} = RA

function errorHandler () {
  return function (err) {
    const error = err.code === 11000
      ? createError(409)
      : createError(err)

    return rejectP(error)
  }
}

function handeErrors (context) {
  return next => (args, method) => {
    return next(args, method)
      .catch(errorHandler())
  }
}

/**
 * Expose
 */

module.exports = handeErrors
