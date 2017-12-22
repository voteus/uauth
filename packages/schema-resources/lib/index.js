const Joi = require('joi')

const handleErrors = require('@local/joi-http-errors')

const identifier = require('./identifier')
const reference = require('./reference')

const meta = Joi.any()
const body = Joi.any()

const refs = Joi
  .object()
  .pattern(/.+/, reference)

const resource = identifier
  .keys({ meta, body, refs })
  .error(handleErrors())

module.exports = Joi
  .alternatives(
    resource,
    Joi.array().items(resource)
  )
