const express = require('express')
const User = require('../models/user')
const Report = require('../models/report')
const auth = require('../middleware/auth')
const router = new express.Router()
const multer = require('multer')
const randtoken = require('rand-token')
const axios = require('axios')

router.post('/register', async (req, res, next) => {
	const register = async () => {
    	try {
        	if (req.body.activationToken === "") {
            	req.body.activationToken = undefined
        	}
        	if (req.body.banned) {
            	req.body.banned = false
        	}
        	let user = new User(req.body)
        	await user.save()
        	
        	const templateParams = {
            	to_name: user.fullname,
            	activationToken: user.activationToken,
            	to_email: user.email
        	};
        	const data = {
            	user_id: 'user_Ai23rS8sowpXpPBkyyhtd',
            	service_id: 'service_lybhn1j',
            	template_id: 'template_tevwsmi',
            	template_params: templateParams
        	};
        	
        	try {
            	// await axios.post('https://api.emailjs.com/api/v1.0/email/send', data)
            	res.status(201).send({ message: "Harap aktivasi dengan memasukkan token yang telah dikirimkan ke e-mail anda" })
        	}
        	catch (err) {
            	res.status(404).send({ message: "Unknown error from EmailJS" })
        	}
    	} catch(e) {
        	console.log(e);
        	res.status(400).json(e)
    	}
	}
	register()
})

router.post('/activation', async (req, res) => {
	const activateAccount = async () => {
  		try {
		//     const user = await User.findByCredentials(req.body.email, req.body.password)
    		let user = await User.findOne({email: req.body.email}).exec()
    		if (user.activationToken === "") {
        		res.status(200).send({ message: 'Sudah teraktivasi sebelumnya', user, token })
    		} else if (req.body.activationToken === undefined || req.body.activationToken === "" || req.body.email === undefined) {
        		res.status(400).send({ message: `Path both 'email' and 'activationToken' are required, or invalid` })
    		} else if (user.activationToken === req.body.activationToken) {
        		user.activationToken = ""
        		const token = await user.generateAuthToken()
        		res.status(200).send({ message: 'Aktivasi Sukses', user, token })
    		} else if (user.activationToken !== req.body.activationToken) {
        		res.status(401).send({ message: 'Aktivasi Gagal, token yang dimasukkan salah' })
    		} else {
        		res.status(500).send({ message: 'Unknown error' })
    		}
  		} catch (e) {
    		res.status(404).send({
      		message: 'Pengguna tidak ditemukan',
    		})
  		}
	}
	activateAccount()
})

router.post('/login', async (req, res) => {
	const login = async () => {
		try {
    		if (req.body.password === undefined || req.body.email === undefined) {
          		res.status(400).send({
              		message: `Path both 'email' and 'password' are required`
        		});
    		} else {
        		const user = await User.findByCredentials(req.body.email, req.body.password)
        		if (user.activationToken !== "") {
            		res.status(401).send({ message: 'Harap aktivasi terlebih dahulu' })
        		} else if (user.banned) {
            		res.status(403).send({
                		message: `Maaf akun anda dinonaktifkan oleh admin`                
            		});
        		} else {
            		user.activationToken = ""
            		await user.save()
            		const token = await user.generateAuthToken()
            		res.status(200).send({ user, token })
        		}   
    		}
  		} catch (e) {
      		res.status(404).send({
        		message: 'Pengguna tidak ditemukan',
    		})
  		}
	}
	login()
})

router.patch('/edit-profile', auth, async (req, res) => {
  try {
    if (req.body.fullname === "" || req.body.email === "" || req.body.password === "") {
        res.status(400).send({ message: `Path 'fullname', 'email' and 'password' are required, or invalid` })
    } else {
        let userFound = await User.findOne({email: req.body.email}).exec()
//         found h.imam1998@gmail.com
        if (userFound && userFound._id.toString() !== req.user._id.toString()) {
            res.status(404).send({message: 'Email tidak tersedia'})
        } else {
//             res.status(404).send({message: "nf, u can save now"})
            req.user.fullname = req.body.fullname
            req.user.username = req.body.username
            req.user.password = req.body.password
            await req.user.save()
            res.status(200).send( req.user )
        }
    }
  } catch (e) {
    res.status(500).send({ message: 'Unknown error' })
  }
})

router.patch('/ban/:id', auth, async (req, res) => {
	const ban = async () => {
  		try {
  			if (!req.user.admin) {
        		res.status(401).send({ message: 'Admin Only' })
    		} else {
        		const targetUser = await User.findById(req.params.id)
        		if (!targetUser) {
            		res.status(404).send({ message: 'User not found' })
        		} else if (targetUser.admin) {
            		res.status(400).send({ message: 'Can not ban admin users' })
        		} else {
            		targetUser.tokens = []
            		if (!targetUser.banned) {
            			// await Report.deleteMany({userId: {$exists: true}, userId: targetUser._id})
            			await Report.deleteMany({userId: {$exists: true}, userId: targetUser._id})
            		}
            		targetUser.banned = !targetUser.banned
            		await targetUser.save()
            		if (targetUser.banned) {
                		res.status(201).send({ status: targetUser.banned ,message: 'Target banned successfully' })
            		} else {
                		res.status(201).send({ status: targetUser.banned, message: 'Target unbanned successfully' })
            		}
        		}
    		}
  		} catch (e) {
    		res.status(500).send({ message: 'Unknown error' })
  		}
	}
	ban()
})

router.post('/logout', auth, async (req, res) => {
	const logout = async () => {
  		try {
    		req.user.tokens = req.user.tokens.filter(token => {
      		return token.token !== req.token
    		})
    		await req.user.save()
		
    		res.status(200).send({ message: 'Logout Success' })
  		} catch (e) {
    		res.status(500).send({ message: 'Logout Gagal' })
  		}
	}
	logout()
})

router.get('/me', auth, async (req, res) => {
  res.send(req.user)
})

// router.get('/users', async (req, res) => {
//   try {
//     const users = await User.find({}).select({ 'password': 0, 'tokens': 0, 'activationToken': 0 }).exec()
//     res.status(200).send({users})
//   } catch (e) {
//     res.status(404).send({message: "user not found"})
//   }
// })

router.get('/user/:id', async (req, res) => {
	const getUser = async () => {
		try {
    		const userId = req.params.id
    		const user = await User.findById(userId).select({ 'email': 0, 'password': 0, 'tokens': 0, 'activationToken': 0 })
    		user.password = undefined
    		user.tokens = undefined
    		user.activationToken = undefined
    		res.status(200).send({user})
  		} catch (e) {
    		res.status(404).send({message: "user not found"})
  		}
	}
	getUser()
})

router.get('/users/search/user/:query/:page', async (req, res) => {
	const searchUsers = async () => {
		if (!/^[a-zA-Z0-9 ]*$/.test(req.params.query)) {
			return res.status(400).send({m: "only alphanumeric allowed"})
		}
	
		const query = req.params.query.split(" ")
		//console.log(query)
		let regex = [];
		for (let i = 0; i < query.length; i++) {
			regex[i] = new RegExp(query[i], 'i');
		}
  		try {
    		const limit = 8
    		const page = parseInt(req.params.page) - 1
    		const skip = page * limit
    		const users = await User.find({"fullname": {$in: regex}}).select({ 'email': 0, 'password': 0, 'tokens': 0, 'activationToken': 0 }).limit(limit).skip(skip)
    		const count = await User.find({"fullname": {$in: regex}}).countDocuments()
    		res.status(200).send({users, count})
  		} catch (e) {
    		res.status(404).send({message: "user not found"})
  		}
	}
	searchUsers()
})

router.get('/users/search/ban/:query/:page', auth, async (req, res) => {
	const searchBanUsers = async () => {
		if (!req.user.admin) {
			res.status(401).send({message: "admin only"})
			return
		}
		if (!/^[a-zA-Z0-9 ]*$/.test(req.params.query)) {
			return res.status(400).send({m: "only alphanumeric allowed"})
		}
	
		const query = req.params.query.split(" ")
		//console.log(query)
		let regex = [];
		for (let i = 0; i < query.length; i++) {
			regex[i] = new RegExp(query[i], 'i');
		}
  		try {
    		const limit = 8
    		const page = parseInt(req.params.page) - 1
    		const skip = page * limit
    		const users = await User.find({"fullname": {$in: regex}}).select({ 'password': 0, 'tokens': 0, 'activationToken': 0 }).limit(limit).skip(skip)
    		const count = await User.find({"fullname": {$in: regex}}).countDocuments()
    		res.status(200).send({users, count})
  		} catch (e) {
    		res.status(404).send({message: "user not found"})
  		}
	}
	searchBanUsers()
})

module.exports = router
