# Usage

Examples of usage using [Axios][] library 

In following examples `req` object is [Axios][] library preconfigured as

```js
const Axios = require('axios')

const baseURL = 'http://localhost:3030'

const req = Axios.create({ baseURL })
```

## Registration

Valid registration

```js
const data = {
  name     : 'Nyx',
  email    : 'nyx@gmail.com',
  password : 'Passw0rd'
}

// Valid: resolves with status `201 Created`
request.post('/user', data)
```

If any errors present, will be rejected with error code (e.g. `409 Conflict`)

## Login

```js
const data = {
  email    : 'nyx@gmail.com',
  password : 'Passw0rd'
}

// Valid: resolves with JWT token in response data
request.post('/token', data)
```

Response body is like

```json
{
  "body": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJib2R5Ijp7Im5hbWUiOiJFeG8gTmFqIiwiZW1haWwiOiJleG9AZ21haWwuY29tIn0sImlkIjoicmtrOFpfbEhNIiwidHlwZSI6InVzZXJzIiwiaWF0IjoxNTE2NDM3MDcwfQ.tb7Rj_urrrCyZhq_OpI8u05fxxMKoIpNI40dWdCpWBY"
}
```

Having the `secret`, this can be decoded with a `jwt` library, with payload as

```
{
  "id": "rkk8Z_lHm",
  "type": "users"
}
```

If a client does not posses `secret`, it's possible to obtain user data from
server as follows

```js
// `jwt` holds token
const headers = {
  'Authorization': `Bearer ${jwt}`
}

request.get('/user', { headers })
```

Which resolves with body

```json
{
  "body": {
    "email": "exo@gmail.com",
    "name": "Exo Naj"
  },
  "id": "rkk8Z_lHM",
  "type": "users"
}
```
