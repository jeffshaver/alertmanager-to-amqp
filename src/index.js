require('dotenv').config({ path: '.env', silent: true })

const { AMQP_ENDPOINT, QUEUE } = process.env
const http = require('http')
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
const express = require('express')
const compression = require('compression')
const serveStatic = require('serve-static')
const bodyParser = require('body-parser')
const { ReconnectingAMQP } = require('./reconnecting-amqp')
const { logger } = require('./logger')
const amqp = new ReconnectingAMQP(AMQP_ENDPOINT)

// const { SERVER_CERT_PATH, SERVER_KEY_PATH } = process.env
// const serverOptions = {
//   cert: fs.readFileSync(SERVER_CERT_PATH),
//   key: fs.readFileSync(SERVER_KEY_PATH)
// }

start()

async function start() {
  const app = express()
  const httpServer = http.createServer(app)

  await amqp.connect()

  app.use(compression())
  app.use(bodyParser.json())

  app.post('/', (req, res) => {
    logger.info(req.body)

    amqp.sendToQueue(QUEUE, JSON.stringify(req.body))

    res.status(200).send('ok')
  })

  app.use(function(err, req, res, next) {
    logger.error(err.stack)
    res.status(500).send('Something broke!')
  })

  httpServer.listen(3000, () => {
    logger.info('app listening on port 3000')
  })
}
