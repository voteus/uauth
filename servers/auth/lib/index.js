const Koa = require('koa')

const mount = require('koa-mount')

const logger = require('koa-logger')
const bodyparser = require('koa-bodyparser')

const jwt = require('koa-jwt')

const passport = require('./passport')

const router = require('./router')

const errorHandler = require('./error-handler')

const app = new Koa()

app.use(logger())

app.use(bodyparser())

app.use(jwt({ secret: 'changeit', passthrough: true }))

app.use(errorHandler())

app.use(router())

module.exports = app
