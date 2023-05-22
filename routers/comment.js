const express = require('express')
const Post = require('../models/post')
const User = require('../models/user')
const Comment = require('../models/comment')
const auth = require('../middleware/auth')
const router = new express.Router()
const mongoose = require('mongoose')
const axios = require('axios')

router.post('/create-comment', auth, async (req, res) => {
	const saveComment = async () => {
		const comment = new Comment({
  			ownerId: req.user._id,
  			postId: req.body.postId,
  			comment: req.body.comment,
  			read: false
  		})
  		await comment.save()
  		try {
			const postOwnerDetails = await Post.aggregate([
				{ $match : { _id : mongoose.Types.ObjectId(comment.postId) } },
					{
						$lookup: {
							from: "users",
							localField: "ownerId",    // field in the orders collection
							foreignField: "_id",  // field in the items collection
							as: "userDetails"
						}
					},
				{
					$unwind:'$userDetails'
				},
				{
					$project: {
						"userDetails.fullname": 1,
						"userDetails.email": 1,
						"title": 1
					}
				}
			]);
			const templateParams = {
				from_name: req.user.fullname,
				to_name: postOwnerDetails[0].userDetails.fullname,
				to_email: postOwnerDetails[0].userDetails.email,
				post_title: postOwnerDetails[0].title,
				comment: req.body.comment,
				post_url: `https://fd-sifo.vercel.app/post/${req.body.postId}`
			};
			if (templateParams.to_email !== req.user.email) {
				const data = {
					user_id: 'user_Ai23rS8sowpXpPBkyyhtd',
					service_id: 'service_lybhn1j',
					template_id: 'template_2u2kj74',
					template_params: templateParams
				};
				// await axios.post('https://api.emailjs.com/api/v1.0/email/send', data)
				let axiosConfigC = {
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer MGYxYTQ2YjktZGEwOC00YzY0LTkwZjYtNzY4ODU5NmQxZTY1`
					}
				};
				const payload = {
					app_id: "7d88b5c3-f87d-4370-8865-5f2e129be9ff",
					headings: {
						en: "Anda mendapatkan komentar baru"
					},
					contents: {
						en: req.body.comment
					},
					url: `https://fd-sifo.vercel.app/post/${req.body.postId}`,
					filters: [
						{
							field: "tag", key: "email", relation: "=", value: templateParams.to_email
						}
					]
				};
				await axios.post(
					"https://onesignal.com/api/v1/notifications", payload, axiosConfigC
				);
				res.status(201).send({m: "terkirim"})	
			} else {
				res.status(201).send({m: "tak terkirim"})	
			}
		} catch (e) {
			res.status(500).send(e)
		}	
	}
  	saveComment()
})

router.get('/post/:postId/comments/:page', async (req, res) => {
	const getComments = async () => {
		const postId = req.params.postId
  		const limit = 3
  		const page = parseInt(req.params.page) - 1
  		const skip = page * limit
  		try {
    		const commentsCount = await Comment.find({postId: mongoose.Types.ObjectId(postId)}).countDocuments()
    		const comments = await Comment.aggregate([
    			{ $match : { postId : mongoose.Types.ObjectId(postId) } },
				{
      				$lookup: {
         				from: "users",
         				localField: "ownerId",    // field in the orders collection
         				foreignField: "_id",  // field in the items collection
         				as: "userDetails"
      				}
   				},
   				{
            		$unwind:'$userDetails'
        		},
        		{
            		$project: {
                		"userDetails._id": 0,
                		"userDetails.activationToken": 0,
                		"userDetails.email": 0,
                		"userDetails.password": 0,
                		"userDetails.tokens": 0,
                		"userDetails.updatedAt": 0,
                		"userDetails.createdAt": 0,
            		}
        		}
			]).sort({createdAt: -1}).skip(skip).limit(limit)
    		res.status(200).send({comments, commentsCount})
  		} catch (e) {
    		res.status(404).send({message: "unknown error"})
  		}		
	}
	getComments()
})

router.get('/notifications/:page', auth, async (req, res) => {
	const getNotifications = async () => {
		const limit = 8
  		const page = parseInt(req.params.page) - 1
  		const skip = page * limit
		try {
			const posts = await Post.find({ownerId: mongoose.Types.ObjectId(req.user._id)}).select({ '_id': 1 }).exec()
			const postIds = []
			posts.map(({_id}, i) => postIds.push(_id))
			//console.log(postIds)
			//let comment = await Comment.find({ownerId: mongoose.Types.ObjectId(req.user._id)}).sort({createdAt: -1})
			const comments = await Comment.aggregate([
    			{
    				$match: {
						$and: [
    						{ "ownerId": { $ne: req.user._id } },
      						{ "postId": { $in: postIds } }
    					]
  					}
    			},
				{
      				$lookup: {
         				from: "posts",
         				localField: "postId",    // field in the orders collection
         				foreignField: "_id",  // field in the items collection
         				as: "postDetails"
      				}
   				},
   				{
            		$unwind:'$postDetails'
        		},
   				{
      				$lookup: {
         				from: "users",
         				localField: "ownerId",    // field in the orders collection
         				foreignField: "_id",  // field in the items collection
         				as: "userDetails"
      				}
   				},
   				{
            		$unwind:'$userDetails'
        		},
        		{
            		$project: {
                		"postDetails._id": 0,
                		"postDetails.ownerId": 0,
                		"postDetails.tags": 0,
                		"postDetails.createdAt": 0,
                		"postDetails.updatedAt": 0,
                		"userDetails._id": 0,
                		"userDetails.activationToken": 0,
                		"userDetails.email": 0,
                		"userDetails.password": 0,
                		"userDetails.tokens": 0,
                		"userDetails.updatedAt": 0,
                		"userDetails.createdAt": 0,
            		}
        		}
			]).sort({createdAt: -1}).skip(skip).limit(limit)
			const count = await Comment.find(
				{ $and: 
					[
    					{ "ownerId": { $ne: req.user._id } },
      					{ "postId": { $in: postIds } }
    				]
				}
			).countDocuments()
			const countUnread = await Comment.find(
				{ $and: 
					[
    					{ "ownerId": { $ne: req.user._id } },
      					{ "postId": { $in: postIds } },
      					{ "read": false }
    				]
				}
			).countDocuments()
			res.status(201).send({comments, count, countUnread})
		} catch (e) {
			res.status(500).send({message: "unknown error"})
		}	
	}
	getNotifications()
})

router.post('/read/:id', auth, async (req, res) => {
	const id = req.params.id
	try {
		const posts = await Post.find({ownerId: mongoose.Types.ObjectId(req.user._id)}).select({ '_id': 1 }).exec()
		const postIds = []
		posts.map(({_id}, i) => postIds.push(_id.toString()))
		
		let comment = await Comment.findById(id)
		//console.log(postIds)
		//console.log(comment.postId.toString())
		if (postIds.includes(comment.postId.toString())) {
			comment.read = true
			comment.save()
			res.status(201).send({comment: comment, message: "success"})
		} else {
			// not yours
			res.status(403).send({message: "not yours/ either admin"})
			//res.send({ow: post.ownerId, u: req.user._id})
		}
	} catch (e) {
		res.status(404).send({message: "comments not found"})
	}
})

router.post('/read-all', auth, async (req, res) => {
	try {
		const posts = await Post.find({ownerId: mongoose.Types.ObjectId(req.user._id)}).select({ '_id': 1 }).exec()
		const postIds = []
		posts.map(({_id}, i) => postIds.push(_id.toString()))
		
		let comment = await Comment.updateMany(
			{ $and: 
				[
    				{ "ownerId": { $ne: req.user._id } },
      				{ "postId": { $in: postIds } }
    			]
			}, { read: true })
		res.status(201).send({comment: comment, message: "success"})
	} catch (e) {
		res.status(500).send({message: "uknown error"})
	}
})

// router.get('/all-comments', async (req, res) => {
// 	try {
// 		let comment = await Comment.find({})
// 		res.status(201).send({comment: comment, message: "success"})
// 	} catch (e) {
// 		res.status(500).send({message: "unknown error"})
// 	}
// })

router.delete('/comment/:id', auth, async (req, res) => {
	const deleteComment = async () => {
		try {
			const comment = await Comment.findById(req.params.id)
			if (comment.ownerId.toString() === req.user._id.toString() || req.user.admin) {
				await comment.remove()
				res.status(201).send({comment: comment.comment, message: "success"})
			} else {
				// not yours
				res.status(403).send({comment: comment.comment, message: "not yours/ either admin"})
				//res.send({ow: post.ownerId, u: req.user._id})
			}
		} catch (e) {
			res.status(404).send({message: "comment not found"})
		}	
	}
	deleteComment()
})

module.exports = router
