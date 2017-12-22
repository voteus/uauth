const config = require('config')

const app = require('./lib')

const port = config.get('server.port')

app.listen(port, () => {
  console.log(`http://127.0.0.1:${port}`)
})
