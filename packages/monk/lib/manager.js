const monk = require('monk')

const R = require('ramda')

const Collection = require('./collection')

const middlewares = require('./middlewares')

const {
  merge
} = R

const defaultOptions = {
  middlewares
}

class Manager extends monk {
  /**
   * Gets a collection.
   *
   * @param {String} name - name of the mongo collection
   * @param {Object} [opts] - options to pass to the collection
   * @return {Collection} collection to query against
   */

  get (name, opts = {}) {
    if (opts.cache === false || !this.collections[name]) {
      delete opts.cache
      const options = merge(defaultOptions, opts)
      this.collections[name] = new Collection(this, name, options)
    }

    return this.collections[name]
  }

}

module.exports = Manager
