const debug = require('debug')('cognita:error-handler')

function errorHandler () {
  return async (ctx, next) => {
    try {
      await next()
    } catch (error) {
      debug('error: %O', error)

      ctx.status = error.status || 400
      ctx.body = { error }
    }
  }
}

module.exports = errorHandler
