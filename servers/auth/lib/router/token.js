const R = require('ramda')

const config = require('config')

const Router = require('koa-router')

const jwt = require('jsonwebtoken')

const passport = require('../passport')

/**
 * Constants
 */

const JWT = config.get('jwt')

/**
 * Utils
 */

const {
  pick,
  path,
  compose
} = R

/**
 * Actions
 */

function send () {
  const sign = user => {
    const payload = pick(['id', 'type'])
    return jwt.sign(user, JWT.secret)
  }

  const getToken = compose(
    sign,
    path(['state', 'user'])
  )

  return (ctx, next) => {
    ctx.status = 201
    ctx.body = {
      body: getToken(ctx)
    }
  }
}

module.exports = () => {
  const router = new Router()

  router.use(passport.initialize())

  router.post('local', '/',
    passport.authenticate('local', { session: false }))

  router.get('facebook', '/facebook/:callback?',
    passport.authenticate('facebook', { session: false }))

  router.get('google', '/google/:callback?',
    passport.authenticate('google', { session: false }))

  router.use(send())

  return router
}
