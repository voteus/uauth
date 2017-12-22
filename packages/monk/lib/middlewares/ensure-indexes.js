function ensureIndexes (context) {
  return next => (args, method) => {
    const { collection } = context

    if (!collection.readyIndexes) {
      const indexes = collection._indexes || []

      collection.readyIndexes = indexes.length
        ? args.col.createIndexes(indexes)
        : Promise.resolve()
    }

    return collection.readyIndexes
      .then(() => next(args, method))
  }
}

module.exports = ensureIndexes
