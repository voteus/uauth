const Joi = require('joi')

const R = require('ramda')
const RA = require('ramda-adjunct')

const bcrypt = require('bcrypt')

const usersOptions = {
  indexes: [
    {
      key: {
        'body.email': 1,
        'refs.origin.type': 1
      },
      unique: true
    }
  ]
}

//

class Users {
  constructor (opts = {}) {
    const { monkInstance } = opts

    this.cols = {
      users: monkInstance.get('users', usersOptions),
      passwords: monkInstance.get('passwords')
    }
  }

  async createLocal (body) {
    const { users, passwords } = this.cols

    const format = data => {
      const name = Joi.string()
      const email = Joi.string().email()
      const password = Joi.string().min(8).strip()

      const body = Joi.object({ name, email, password })

      const schema = Joi.object({ body })

      const options = {
        stripUnknown: true,
        presence: 'required'
      }

      return schema.validate(data, options)
    }

    const data = await format({ body })

    const subject = await users.insert(data)

    const hash = await bcrypt.hash(body.password, 8)

    await passwords.insert({
      body: { hash },
      refs: { subject }
    })

    return subject
  }

  async ensureOAuth (data) {
    const { users } = this.cols

    try {
      const { origin } = data.refs

      const subject = await users
        .findOne({ refs: { origin } })

      return subject
    } catch (err) {
      return users.insert(data)
    }
  }

  async findOneById (id) {
    const { users } = this.cols

    return users.findOne({ id })
  }

  async findOneAndVerify (body) {
    const { users, passwords } = this.cols

    const { email, password } = body

    const query = {
      'refs.origin': { $exists: false },
      'body.email': email
    }

    const subject = await users.findOne(query)

    const creds = await passwords.findOne({ refs: { subject } })

    const same = await bcrypt.compare(password, creds.body.hash)

    return same
      ? subject
      : new Error('not authorized')
  }
}

module.exports = Users
