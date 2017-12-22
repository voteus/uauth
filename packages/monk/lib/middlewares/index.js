module.exports = [
  require('./format-query'),
  require('./cast-resource'),
  require('./handle-errors'),
  require('./handle-response'),
  require('monk-middleware-options'),
  require('monk-middleware-fields'),
  require('monk-middleware-handle-callback'),
  require('monk-middleware-wait-for-connection'),
  require('./ensure-indexes'),
]
