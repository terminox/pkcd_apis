const Mongoose = require('mongoose')
const Schema   = Mongoose.Schema

// SCHEMA ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const options = {
  discriminatorKey: 'type'
}

const User = new Schema({
  name:  { type: String },
  type:  { type: String, enum: ['admin', 'facebook', 'pkcd'] },
  token: { type: String, required: true }
})

// PLUGINS :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const autoIncrement = require('mongoose-auto-increment')
const timestamps    = require('mongoose-timestamp')
const deepPopulate  = require('mongoose-deep-populate')(Mongoose)

User.plugin(autoIncrement.plugin, { model: 'User', field: 'user_id' })
User.plugin(timestamps)
User.plugin(deepPopulate)

module.exports = Mongoose.model('User', User)
