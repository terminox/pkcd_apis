const Mongoose = require('mongoose')
const Schema   = Mongoose.Schema

const User = require('./user')

// SCHEMA ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const options = {
  discriminatorKey: 'type'
}

const Admin = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }
}, options)

module.exports = User.discriminator('admin', Admin)
