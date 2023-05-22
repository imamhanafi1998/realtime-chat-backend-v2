const express = require('express')
const Message = require('../models/message')
const auth = require('../middleware/auth')
const router = new express.Router()
const mongoose = require('mongoose')
const axios = require('axios')

router.get('/messages', async (req, res) => {	
	Message.find({}, (err, messages) => {
        res.send(messages);
        console.log("sukses")
    })
})

router.post('/messages', async (req, res) => {
    const message = new Message(req.body);
    await message.save((err) => {
        if (err) {
            console.log("gagal")
            sendStatus(500);
        }
        // io.emit('message', req.body)
        res.sendStatus(200);
    })
})

module.exports = router
