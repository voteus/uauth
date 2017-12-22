const Joi = require('joi')

const shortid = require('shortid')

const id = Joi
  .string()
  .default(shortid, 'shortid')

const type = Joi
  .string()
  .when('$type', {
    is: Joi.exist(),
    then: Joi.default(Joi.ref('$type')),
    otherwise: Joi.default('entities')
  })

const identifier = Joi
  .object({ id, type })
  .options({ stripUnknown: true })

module.exports = identifier
