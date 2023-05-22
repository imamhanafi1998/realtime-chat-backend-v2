const express = require('express')
const Post = require('../models/post')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const mongoose = require('mongoose')
const axios = require('axios')

router.post('/create-post', auth, async (req, res) => {
	const savePost = async () => {
		const tags = req.body.tags
		if (req.body.title === "" || req.body.desc === "" || !req.body.title || !req.body.desc || !req.body.tags) {
			res.status(400).send({ message: `Path 'title', 'desc' and 'tags' are required, or invalid` })
		} else if ((tags.length === undefined) || (typeof(tags) === 'string')) {
			return res.status(400).send({message: "object with key 'tag' must be wrapped in inside 'tags' array"})
		} else {
			if (tags.length > 3 || tags.length < 1) {
				res.status(400).send({message: "tags max 3 and min 1"})
			} else {
				let passed = true
				tags.map(({tag}, i) => {
					if (tag === undefined || tag === "" || tag.length > 10 || (!/^[a-zA-Z0-9]*$/.test(tag))) {
						passed = false
					}
				})
				if (passed) {
					try {
						const post = new Post({
							...req.body,
							ownerId: req.user._id,
						})
						await post.save()
						let axiosConfigC = {
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer MGYxYTQ2YjktZGEwOC00YzY0LTkwZjYtNzY4ODU5NmQxZTY1`
							}
						};
						const payload = {
							app_id: "7d88b5c3-f87d-4370-8865-5f2e129be9ff",
							headings: {
								en: "Post baru di FD-SIFO"
							},
							contents: {
								en: post.title
							},
							filters: [
								{
									field: "tag", key: "email", relation: "!=", value: req.user.email
								}
							],
							url: `https://fd-sifo.vercel.app/post/${post._id}`
						};
						await axios.post(
							"https://onesignal.com/api/v1/notifications", payload, axiosConfigC
						);
						res.status(200).send({ message: "created succesfully", post: post, user: req.user });
					} catch (e) {
						res.status(500).send(e)
		
					}
				} else {
					res.status(400).send({ message: "BAD REQUEST, key: 'tag', max char: 10, alphanumerics" })
				}
				
			}
		}
	}
	savePost()
})

router.get('/posts/search/body/:query/:page', async (req, res) => {
	const searchPost = async () => {
		if (!/^[a-zA-Z0-9 ]*$/.test(req.params.query)) {
			return res.status(400).send({m: "only alphanumeric allowed"})
		}
		//const query = req.params.query
		const query = req.params.query.split(" ")
		//console.log(query)
		let regex = [];
		for (let i = 0; i < query.length; i++) {
			regex[i] = new RegExp(query[i], 'i');
		}
		const limit = 8
		const page = parseInt(req.params.page) - 1
		const skip = page * limit
	
		try {
			//	const posts = await Post.find({"title": new RegExp(title, 'i')}).sort({updatedAt: -1}).skip(skip).limit(limit)
			const posts = await Post.aggregate([
				{
					$match: {
						$or: [
    						{ "title": { $in: regex } },
      						{ "desc": { $in: regex } }
    					]
  					}
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
         			$lookup: {
         				from: "comments",
         				localField: "_id",
         				foreignField: "postId",
         				as: "commentDetails"
         			}
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
         				"commentDetails.ownerId": 0,
         				"commentDetails.postId": 0,
         				"commentDetails.comment": 0,
         				"commentDetails.updatedAt": 0,
         				"commentDetails.createdAt": 0
         			}
         		}
			]).skip(skip).limit(limit)
			const count = await Post.find({ $or: [
				{ "title": { $in: regex } },
				{ "desc": { $in: regex } }
			] }).countDocuments()
			res.status(200).send({posts, count})
		} catch (e) {
			res.status(500).send(e)
		}
	}
	searchPost()
})

router.get('/posts/search/tag/:query/:page', async (req, res) => {
	const searchPost = async () => {
		if (!/^[a-zA-Z0-9 ]*$/.test(req.params.query)) {
			return res.status(400).send({m: "only alphanumeric allowed"})
		}
	
		//const query = req.params.query
		const query = req.params.query.split(" ")
		//console.log(query)
		let regex = [];
		for (let i = 0; i < query.length; i++) {
			regex[i] = new RegExp(query[i], 'i');
		}
		const limit = 8
		const page = parseInt(req.params.page) - 1
		const skip = page * limit
	
		try {
			//	const posts = await Post.find({"title": new RegExp(title, 'i')}).sort({updatedAt: -1}).skip(skip).limit(limit)
			const posts = await Post.aggregate([
				{
					$match: {
						$or: [
    						{ "tags.tag": { $in: regex } }
    					]
  					}
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
         			$lookup: {
         				from: "comments",
         				localField: "_id",
         				foreignField: "postId",
         				as: "commentDetails"
         			}
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
         				"commentDetails.ownerId": 0,
         				"commentDetails.postId": 0,
         				"commentDetails.comment": 0,
         				"commentDetails.updatedAt": 0,
         				"commentDetails.createdAt": 0
         			}
         		}
			]).skip(skip).limit(limit)
			const count = await Post.find({"tags.tag": {$in: regex}}).countDocuments()
			res.status(200).send({posts, count})
		} catch (e) {
			res.status(500).send(e)
		}
	}
	searchPost()
})

router.get('/posts/relevant/:id', async (req, res) => {
	try {
		const post = await Post.findById(req.params.id)
		
//		const title = post.title.split(" ")
//		let regexTitle = [];
//		for (let i = 0; i < title.length; i++) {
//			regexTitle[i] = new RegExp(title[i], 'i');
//		}
		
//		let regexDesc = [];
//		const desc = post.desc.split(" ")
//		for (let i = 0; i < desc.length; i++) {
//			regexDesc[i] = new RegExp(desc[i], 'i');
//		}

		const popularPosts = await Post.aggregate([
			{
				$match: {
					"_id": { $ne: post._id }
  				}
			},
         	{
         		$lookup: {
         			from: "comments",
         			localField: "_id",
         			foreignField: "postId",
         			as: "commentDetails"
         		}
         	},
         	{
         		$project: {
         			"commentDetails.ownerId": 0,
         			"commentDetails.postId": 0,
         			"commentDetails.comment": 0,
         			"commentDetails.updatedAt": 0,
         			"commentDetails.createdAt": 0,
         		}
         	},
         	{
         		$addFields: {
         			"commentsCount": {
         				$size: '$commentDetails'
         			}
         		}
         	},
         	{
         		$sort: {
         			"commentsCount": -1
         		}
         	},
         	{
         		$project: {
         			"commentsCount": 0
         		}
         	}
        ]).limit(2)
		
		const idPop = []
		popularPosts.map((post, i) => idPop.push(post._id))
		let tags = []
		post.tags.map((tag, i) => tags.push(tag.tag))
		let regexTags = [];
		for (let i = 0; i < tags.length; i++) {
			regexTags[i] = new RegExp(tags[i], 'i');
		}
		
//		console.log(tags)
		const relevantPosts = await Post.find(
			{
				$and: [
					{"tags.tag": {$in: regexTags}},
					{"_id": {$ne: post._id}},
					{"_id": {$nin: idPop}},
				]
			}).limit(2)
			
//		console.log({popularPosts, relevantPosts})
		
		const newPosts = [
			...relevantPosts,
			...popularPosts
		]
		res.status(200).send({newPosts})
	} catch (e) {
		res.status(500).send(e)
	}
})

router.get('/posts/:sortBy/:page', async (req, res) => {
	const getPosts = async () => {
		try {
			const limit = 8
			const page = parseInt(req.params.page) - 1
			const skip = page * limit
			const sortBy = req.params.sortBy
			if (sortBy === "t") {
				let posts = await Post.aggregate([
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
         			$lookup: {
         				from: "comments",
         				localField: "_id",
         				foreignField: "postId",
         				as: "commentDetails"
         			}
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
         				"commentDetails.ownerId": 0,
         				"commentDetails.postId": 0,
         				"commentDetails.comment": 0,
         				"commentDetails.updatedAt": 0,
         				"commentDetails.createdAt": 0
         			}
         		}
         		]).sort({createdAt: -1}).skip(skip).limit(limit)
				const count = await Post.find({}).countDocuments()
				res.status(200).send({posts, count})
			} else if (sortBy === "p") {
				let posts = await Post.aggregate([
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
         			$lookup: {
         				from: "comments",
         				localField: "_id",
         				foreignField: "postId",
         				as: "commentDetails"
         			}
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
         				"commentDetails.ownerId": 0,
         				"commentDetails.postId": 0,
         				"commentDetails.comment": 0,
         				"commentDetails.updatedAt": 0,
         				"commentDetails.createdAt": 0,
         			}
         		},
         		{
         			$addFields: {
         				"commentsCount": {
         					$size: '$commentDetails'
         				}
         			}
         		},
         		{
         			$sort: {
         				"commentsCount": -1
         			}
         		},
         		{
         			$project: {
         				"commentsCount": 0
         			}
         		}
         		]).skip(skip).limit(limit)
				const count = await Post.find({}).countDocuments()
				res.status(200).send({posts, count})
			} else {
				res.status(400).send({message: "bad request, plz p or t"})
			}
		} catch (e) {
			res.status(500).send(e)
		}
	}
	getPosts()
})

router.get('/posts/:userId/:sortBy/:page', async (req, res) => {
	try {
		const limit = 8
		const page = parseInt(req.params.page) - 1
		const skip = page * limit
		const sortBy = req.params.sortBy
		const userId = req.params.userId
		if (sortBy === "t") {
			let posts = await Post.aggregate([
			{ $match : { ownerId : mongoose.Types.ObjectId(userId) } },
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
         		$lookup: {
         			from: "comments",
         			localField: "_id",
         			foreignField: "postId",
         			as: "commentDetails"
         		}
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
         			"commentDetails.ownerId": 0,
         			"commentDetails.postId": 0,
         			"commentDetails.comment": 0,
         			"commentDetails.updatedAt": 0,
         			"commentDetails.createdAt": 0
         		}
         	}
         	]).sort({createdAt: -1}).skip(skip).limit(limit)
			const count = await Post.find({ownerId: mongoose.Types.ObjectId(userId)}).countDocuments()
			res.status(200).send({posts, count})
		} else if (sortBy === "p") {
			let posts = await Post.aggregate([
			{ $match : { ownerId : mongoose.Types.ObjectId(userId) } },
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
         		$lookup: {
         			from: "comments",
         			localField: "_id",
         			foreignField: "postId",
         			as: "commentDetails"
         		}
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
         			"commentDetails.ownerId": 0,
         			"commentDetails.postId": 0,
         			"commentDetails.comment": 0,
         			"commentDetails.updatedAt": 0,
         			"commentDetails.createdAt": 0,
         		}
         	},
         	{
         		$addFields: {
         			"commentsCount": {
         				$size: '$commentDetails'
         			}
         		}
         	},
         	{
         		$sort: {
         			"commentsCount": -1
         		}
         	},
         	{
         		$project: {
         			"commentsCount": 0
         		}
         	}
         	]).skip(skip).limit(limit)
			const count = await Post.find({ownerId: mongoose.Types.ObjectId(userId)}).countDocuments()
			res.status(200).send({posts, count})
		} else {
			res.status(400).send({message: "bad request, plz p or t"})
		}
	} catch (e) {
		res.status(500).send(e)
	}
})

router.get('/post/:id', async (req, res) => {
	const getPost = async () => {
		const id = req.params.id
		try {
			const post = await Post.aggregate([
				{ $match : { _id : mongoose.Types.ObjectId(id) } },
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
         	])
			res.status(200).send({post: post[0]})
		} catch (e) {
			res.status(404).send({message: "post not found"})
		}	
	}
	getPost()
})

router.patch('/edit-post/:postId', auth, async (req, res) => {
	const updatePost = async () => {
		if (req.body.title === "" || req.body.desc === "" || !req.body.title || !req.body.desc || !req.body.tags) {
			res.status(400).send({ message: `Path 'title', 'desc' and 'tags' are required, or invalid` })
		} else if ((req.body.tags.length === undefined) || (typeof(req.body.tags) === 'string')) {
			return res.status(400).send({message: "object with key 'tag' must be wrapped in inside 'tags' array"})
			//return res.send({message: req.body.tags.length})
		} else {
			try {
				let postFound = await Post.findById(req.params.postId)
	//         	found 1 post
				if (postFound.ownerId.toString() === req.user._id.toString()) {
				//        		its my post
					if (req.body.tags.length > 3 || req.body.tags.length < 1) {
						res.status(400).send({message: "tags max 3 and min 1"})
					} else {
					
						let passed = true
						req.body.tags.map(({tag}, i) => {
							if (tag === undefined || tag === "" || tag.length > 10 || (!/^[a-zA-Z0-9]*$/.test(tag))) {
								passed = false
							}
						})
						if (passed) {
							try {
								postFound.title = req.body.title
								postFound.desc = req.body.desc
								postFound.tags = req.body.tags
								await postFound.save()
								res.status(200).send({ message: "changed succesfully" })
							} catch (e) {
								res.status(500).send(e)
				
							}
						} else {
							res.status(400).send({ message: "BAD REQUEST, key: 'tag', max char: 10, alphanumerics" })
						}
						
					}
				} else {
				//             		not my post
				res.status(403).send({message: 'Its not your own post'})
				}
			} catch (e) {
				res.status(500).send({ message: 'Post not found' })
			}
		}		
	}
	updatePost()
})

router.delete('/post/:id', auth, async (req, res) => {
	const deletePost = async () => {
		try {
			const post = await Post.findById(req.params.id)
			if ((post.ownerId.toString() === req.user._id.toString()) || req.user.admin) {
				// await Post.findByIdAndDelete(req.params.id)
				await post.remove()
				res.status(201).send({message: "success"})
			} else {
				// not yours
				res.status(403).send({message: "not yours/ either admin"})
				//res.send({ow: post.ownerId, u: req.user._id})
			}
		} catch (e) {
			res.status(404).send({message: "post not found"})
		}
	}
	deletePost()
})

module.exports = router
