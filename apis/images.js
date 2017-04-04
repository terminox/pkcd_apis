const express = require('express')
const router  = express.Router()

const Image = require('../models/image')

const path     = require('path')
const fs       = require('fs')
const multer   = require('multer')
const passport = require('passport')
const _        = require('underscore')

router.get('/:_uid', passport.authenticate(['bearer', 'bearer-admin']), (req, res) => {
  let uid      = req.params._uid
  let criteria = _.isNaN(Number(uid)) ? { _id: uid } : { image_id: uid }

  Image
  .findOne(criteria)
  .exec((err, image) => {
    if (err)    return res.status(500).send(err)
    if (!image) return res.sendStatus(404)
    res.set('Content-Type', image.contentType)
    res.send(image.buffer)
  })
})

router.post('/upload', multer().single('image'), (req, res) => {
  passport.authenticate('bearer-admin')(req, res, () => {
    let body  = req.body
    let file  = req.file
    let image = new Image({
      name:        body.name,
      buffer:      file.buffer,
      contentType: file.mimetype
    })

    image.save((err, image) => {
      if (err) return res.status(500).send(err)
      res.json(image)
    })
  })
})

module.exports = router
