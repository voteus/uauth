const config = require('config')

const Monk = require('@local/monk')

const Users = require('@local/model-users')

const uri = config.get('mongodb.uri')

const monkInstance = new Monk(uri)

module.exports = new Users({ monkInstance })
