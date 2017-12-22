import test from 'ava'

import Joi from 'joi'

import errorHandler from '..'

test('one', async t => {
  const schema = Joi
    .object()
    .keys({
      id: Joi.number().required(),
      email: Joi.string().email()
    })
    .error(errorHandler())

  const data = { id: 1, email: 'a' }

  await t.throws(schema.validate(data))
    .then(err => {
      t.is(err.status, 422)
      t.is(typeof err.source, 'object')
    })
})
