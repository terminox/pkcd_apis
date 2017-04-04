'use strict'

const express       = require('express')
const path          = require('path')
const logger        = require('morgan')
const cookieParser  = require('cookie-parser')
const bodyParser    = require('body-parser')
const multer        = require('multer')

var app = express()

// DATABASE ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const Mongoose      = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')

if (process.env.MONGODB_PORT_27017_TCP_ADDR) {
  Mongoose.connect(`mongodb://${process.env.MONGODB_PORT_27017_TCP_ADDR}:${process.env.MONGODB_PORT_27017_TCP_PORT}/pkcd`)
} else {
  Mongoose.connect('mongodb://127.0.0.1:27017/pkcd')
}

autoIncrement.initialize(Mongoose.connection)

// PASSPORT (AUTHENTICATION) :::::::::::::::::::::::::::::::::::::::::::::::::::
const passport = require('passport')
require('./config/auth')(app, passport)

// CONFIG ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

// Enable CORS (Cross-origin Resource Sharing)
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  next()
})

// ROUTES ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const index      = require('./apis/index')
const businesses = require('./apis/businesses')
const images     = require('./apis/images')
const users      = require('./apis/users')

app.use('/api', index)
app.use('/api/businesses', businesses)
app.use('/api/images', images)
app.use('/api/users', users)

// RUN :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const port = 3003
app.listen(port, () => {
  console.log(`PKCD SERVER IS RUNNING AT PORT ${port}.`)
})
