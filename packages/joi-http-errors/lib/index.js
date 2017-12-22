const createError = require('http-errors')

function errorHandler () {
  return err => {
    err = Array.isArray(err) ? err[0] : err

    const props = { source: err.context }

    return createError(422, props)
  }
}

module.exports = errorHandler
