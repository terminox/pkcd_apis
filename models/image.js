const Mongoose = require('mongoose')
const Schema   = Mongoose.Schema

// SCHEMA ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const Image = new Schema({
  name:        { type: String },
  buffer:      { type: Buffer, required: true },
  contentType: { type: String, required: true }
})

// PLUGINS :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const autoIncrement = require('mongoose-auto-increment')
const timestamps    = require('mongoose-timestamp')
const deepPopulate  = require('mongoose-deep-populate')(Mongoose)

Image.plugin(autoIncrement.plugin, { model: 'Image', field: 'image_id' })
Image.plugin(timestamps)
Image.plugin(deepPopulate)

module.exports = Mongoose.model('Image', Image)
