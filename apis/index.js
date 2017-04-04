const express = require('express')
const router  = express.Router()

const User         = require('../models/user')
const Admin        = require('../models/admin')
const FacebookUser = require('../models/facebook_user')
const PKCDUser     = require('../models/pkcd_user')
const Image        = require('../models/image')

const async    = require('async')
const jwt      = require('jsonwebtoken')
const multer   = require('multer')
const passport = require('passport')
const _        = require('underscore')
const graph    = require('fbgraph')

router.post('/signup', multer().single('avatar'), (req, res) => {
  let body = req.body

  async.auto({
    avatar: (callback) => {
      if (!req.file) return callback()
      let avatar = req.file.avatar
      if (!avatar)   return callback()

      let image = new Image({
        buffer:      avatar.buffer,
        contentType: avatar.mimetype
      })

      image.save((err, image) => {
        callback(null, image)
      })
    },

    user: (callback) => {
      PKCDUser
      .findOne({ email: body.email })
      .exec((err, user) => {
        callback(null, user)
      })
    }
  }, (err, results) => {
    if (results.user) return res.status(500).send("Email is already used.")

    let user = new PKCDUser({
      name:     body.name,
      email:    body.email,
      password: jwt.sign(body.password, '<secret>'),
      token:    jwt.sign((body.email + body.password), '<secret>'),
      type:     'pkcd'
    })

    if (results.avatar) user.avatar = results.avatar

    user.save((err, user) => {
      if (err) return res.status(500).send(err)
      res.json(user)
    })
  })
})

router.post('/signin', passport.authenticate('local'), (req, res) => {
  PKCDUser
  .findOne({ email: req.user.email })
  .select('-password')
  .exec((err, user) => {
    if (err) return res.status(500).send(err)
    res.json(user)
  })
})

router.post('/fbsignin', passport.authenticate('facebook-token'), (req, res) => {
  res.json(req.user)
})

router.post('/signup/admin', (req, res) => {
  let body = req.body

  if (body.pwd == 'pkcdcreateadmin') {
    let admin = new Admin({
      username: 'admin',
      password: jwt.sign('admin', '<secret>'),
      token:    jwt.sign('adminadmin', '<secret>'),
      type:     'admin'
    })

    admin.save((err, admin) => {
      if (err) res.status(500).send(err)
      res.json(admin)
    })
  } else {
    res.sendStatus(404)
  }
})

router.post('/signin/admin', passport.authenticate('local-admin'), (req, res) => {
  Admin
  .findOne({ username: req.user.username })
  .select('-password')
  .exec((err, user) => {
    if (err) return res.status(500).send(err)
    res.json(user)
  })
})

module.exports = router
