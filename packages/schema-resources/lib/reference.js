const Joi = require('joi')

const identifier = require('./identifier')

const reference = Joi
  .alternatives(
    identifier,
    Joi.array().items(identifier)
  )

module.exports = reference
