# joi-http-errors

Joi error handler with http errors

## Usage

```js
const Joi = require('joi')

const errorHandler = require('@local/joi-http-errors')

const schema = Joi.object({ email: Joi.string().email() })

schema
  .validate({ email: '@exo' })
  .catch(err => {
    // err.status = 422
    // err.source = { path, type, ... }
  })

```
