const Router = require('koa-router')

const mount = require('koa-mount')

const user = require('./user')
const token = require('./token')

module.exports = () => {
  const router = new Router()

  router.use('/user', user().routes())
  router.use('/token', token().routes())

  return router.routes()
}
