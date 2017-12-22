const R = require('ramda')

const config = require('config')

const Router = require('koa-router')

const jwt = require('koa-jwt')

const users = require('../model-users')

/**
 * Util
 */

const {
  assocPath
} = R

/**
 * Actions
 */

function create () {
  return (ctx, next) => {
    const { request } = ctx

    const { body } = request

    const send = data => {
      ctx.status = 201

      return next()
    }

    return users
      .createLocal(body)
      .then(send)
      .catch(ctx.throw)
  }
}

function read () {
  return (ctx, next) => {
    const { user } = ctx.state

    const send = data => {
      ctx.status = 200
      ctx.body = data

      return next()
    }

    return users
      .findOneById(user.id)
      .then(send)
      .catch(ctx.throw)
  }
}

module.exports = () => {
  const router = new Router()

  router
    .post('create', '/', create())

  router
    .get('read', '/',
      jwt(config.get('jwt')),
      read()
    )

  return router
}
