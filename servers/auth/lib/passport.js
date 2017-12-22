const R = require('ramda')

const debug = require('debug')('cognita:passport')

const config = require('config')

const passport = require('koa-passport')

const LocalStrategy = require('passport-local').Strategy
const FacebookStrategy  = require('passport-facebook').Strategy
const GoogleStrategy  = require('passport-google-oauth20').Strategy

const users = require('./model-users')

/**
 * Util
 */

const {
  prop,
  head,
  compose,
  applySpec
} = R

/**
 * Login functions
 */

function localLogin (email, password, done) {
  const reject = err => {
    debug('local reject with error: %O', err)
    return done(null, false, err)
  }

  const resolve = data => {
    debug('local verified ok: %O', data)
    return done(null, data)
  }

  return users
    .findOneAndVerify({ email, password })
    .then(resolve)
    .catch(reject)
}

function oauthLogin (token, tokenSecret, profile, done) {
  const format = applySpec({
    refs: {
      origin: {
        id: prop('id'),
        type: prop('provider')
      }
    },
    body: {
      name: prop('displayName'),
      email: compose(prop('value'), head, prop('emails'))
    }
  })

  const resolve = data => done(null, data)

  return users
    .ensureOAuth(format(profile))
    .then(resolve)
    .catch(done)
}

const localOptions = { usernameField: 'email' }
passport.use(new LocalStrategy(localOptions, localLogin))

const facebookOptions = config.get('oauth.facebook')
passport.use(new FacebookStrategy(facebookOptions, oauthLogin))

const googleOptions = config.get('oauth.google')
passport.use(new GoogleStrategy(googleOptions, oauthLogin))

module.exports = passport
