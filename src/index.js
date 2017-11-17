require('dotenv').config({ path: '.env', silent: true })

const http = require('http')
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
const express = require('express')
const compression = require('compression')
const serveStatic = require('serve-static')
const bodyParser = require('body-parser')
const { send } = require('./send')
const { logger } = require('./logger')

// const { SERVER_CERT_PATH, SERVER_KEY_PATH } = process.env
// const serverOptions = {
//   cert: fs.readFileSync(SERVER_CERT_PATH),
//   key: fs.readFileSync(SERVER_KEY_PATH)
// }

const app = express()
const httpServer = http.createServer(app)

app.use(compression())
app.use(bodyParser.json())

app.post('/', (req, res) => {
  logger.info(req.body)

  send(JSON.stringify(req.body))

  res.status(200).send('ok')
})

app.use(function(err, req, res, next) {
  logger.error(err.stack)
  res.status(500).send('Something broke!')
})

httpServer.listen(3000, () => {
  logger.info('app listening on port 3000')
})
