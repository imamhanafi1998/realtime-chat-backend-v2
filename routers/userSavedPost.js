const express = require('express')
const Post = require('../models/post')
const User = require('../models/user')
const UserSavedPost = require('../models/userSavedPost')
const auth = require('../middleware/auth')
const router = new express.Router()
const mongoose = require('mongoose')

router.post('/addSavedPost/:id', auth, async (req, res) => {
	const changeSavedStatus = async () => {
		try {
			const isExists = await UserSavedPost.findOne(
			{
				$and: 
					[
    					{ "userId": req.user._id },
      					{ "postId": mongoose.Types.ObjectId(req.params.id) }
    				]
			})
			if (isExists) {
				res.status(400).send({ message: "exists" })
				return
			}
			const userSavedPost = new UserSavedPost({
				userId: req.user._id,
				postId: mongoose.Types.ObjectId(req.params.id)
			})
			await userSavedPost.save()
			res.status(200).send({ message: "saved succesfully" })
		} catch (e) {
			res.status(404).send({message: "post not found"})
		}
	}
	changeSavedStatus()
})

router.get('/savedPosts/check/:id', auth, async (req, res) => {
	const getSavedStatus = async () => {
		try {
			const isExists = await UserSavedPost.findOne(
			{
				$and: 
					[
    					{ "userId": req.user._id },
      					{ "postId": mongoose.Types.ObjectId(req.params.id) }
    				]
			})
			if (isExists) {
				res.status(200).send({ saved: true })
			} else {
				res.status(200).send({ saved: false })
			}
		} catch (e) {
			res.status(404).send({message: "post not found"})
		}
	}
	getSavedStatus()
})

router.get('/savedPosts/:page', auth, async (req, res) => {
	try {
		const limit = 8
		const page = parseInt(req.params.page) - 1
		const skip = page * limit
		
		const userSavedPost = await UserSavedPost.aggregate([
			{ $match: { "userId": req.user._id } },
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
         		localField: "postDetails.ownerId",    // field in the orders collection
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
         			localField: "postId",
         			foreignField: "postId",
         			as: "commentDetails"
         		}
         	},
         	{
         		$project: {
         			"postDetails._id": 0,
                	"postDetails.ownerId": 0,
                	"postDetails.createdAt": 0,
                	"postDetails.updatedAt": 0,
         			"userDetails.activationToken": 0,
         			"userDetails.email": 0,
         			"userDetails.password": 0,
         			"userDetails.admin": 0,
         			"userDetails.banned": 0,
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
		const count = await UserSavedPost.find({ "userId": req.user._id }).countDocuments()
		res.status(200).send({ userSavedPost, count })
	} catch (e) {
		res.status(404).send({message: "post not found"})
	}
})

router.delete('/savedPost/:id', auth, async (req, res) => {
	try {
		//const savedPost = await UserSavedPost.findById(req.params.id)
		const savedPost = await UserSavedPost.findOne(
		{
			$and: 
				[
    				{ "userId": req.user._id },
      				{ "postId": mongoose.Types.ObjectId(req.params.id) }
    			]
		})
		if (savedPost) {
			await savedPost.remove()
			res.status(200).send({message: "success"})
		} else {
			res.status(403).send({message: "not yours"})
		}
	} catch (e) {
		res.status(404).send({message: "post not found"})
	}
})

router.get('/savedPost/search/:query/:page', auth, async (req, res) => {
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
		const savedPosts = await UserSavedPost.aggregate([
			{ $match: { "userId": req.user._id } },
			{
				$lookup: {
					from: "posts",
         			localField: "postId",    // field in the orders collection
         			foreignField: "_id",  // field in the items collection
         			as: "postDetails",
         		}
         	},
         	{
         		$unwind:'$postDetails'
         	},
			{
				$lookup: {
				from: "users",
         		localField: "postDetails.ownerId",    // field in the orders collection
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
         			localField: "postId",
         			foreignField: "postId",
         			as: "commentDetails"
         		}
         	},
         	{
         		$project: {
         			"postDetails._id": 0,
                	"postDetails.ownerId": 0,
                	"postDetails.createdAt": 0,
                	"postDetails.updatedAt": 0,
         			"userDetails.activationToken": 0,
         			"userDetails.email": 0,
         			"userDetails.password": 0,
         			"userDetails.admin": 0,
         			"userDetails.banned": 0,
         			"userDetails.tokens": 0,
         			"userDetails.updatedAt": 0,
         			"userDetails.createdAt": 0,
         			"commentDetails.ownerId": 0,
         			"commentDetails.postId": 0,
         			"commentDetails.comment": 0,
         			"commentDetails.updatedAt": 0,
         			"commentDetails.createdAt": 0
         		}
         	},
         	{
         		$match: {
					$or: [
    					{ "postDetails.tags.tag": { $in: regex } },
    					{ "postDetails.title": { $in: regex } },
      					{ "postDetails.desc": { $in: regex } }
    				]
  				}
         	}
		]).sort({createdAt: -1}).skip(skip).limit(limit)
		const allSavedPosts = await UserSavedPost.aggregate([
			{ $match: { "userId": req.user._id } },
			{
				$lookup: {
					from: "posts",
         			localField: "postId",    // field in the orders collection
         			foreignField: "_id",  // field in the items collection
         			as: "postDetails",
         		}
         	},
         	{
         		$unwind:'$postDetails'
         	},
         	{
         		$match: {
					$or: [
    					{ "postDetails.tags.tag": { $in: regex } },
    					{ "postDetails.title": { $in: regex } },
      					{ "postDetails.desc": { $in: regex } }
    				]
  				}
         	}
		])
		const savedPostsCount = allSavedPosts.length
		res.status(200).send({userSavedPost: savedPosts, count: savedPostsCount})
	} catch (e) {
		res.status(500).send(e)
	}
})

router.get('/savedPost/search/body/:query/:page', auth, async (req, res) => {
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
		const savedPosts = await UserSavedPost.aggregate([
			{ $match: { "userId": req.user._id } },
			{
				$lookup: {
					from: "posts",
         			localField: "postId",    // field in the orders collection
         			foreignField: "_id",  // field in the items collection
         			as: "postDetails",
         		}
         	},
         	{
         		$unwind:'$postDetails'
         	},
			{
				$lookup: {
				from: "users",
         		localField: "postDetails.ownerId",    // field in the orders collection
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
         			localField: "postId",
         			foreignField: "postId",
         			as: "commentDetails"
         		}
         	},
         	{
         		$project: {
         			"postDetails._id": 0,
                	"postDetails.ownerId": 0,
                	"postDetails.createdAt": 0,
                	"postDetails.updatedAt": 0,
         			"userDetails._id": 0,
         			"userDetails.admin": 0,
         			"userDetails.banned": 0,
         			"userDetails.activationToken": 0,
         			"userDetails.email": 0,
         			"userDetails.password": 0,
         			"userDetails.tokens": 0,
         			"userDetails.updatedAt": 0,
         			"userDetails.createdAt": 0,
         			"commentDetails.ownerId": 0,
         			"commentDetails.postId": 0,
         			"commentDetails.read": 0,
         			"commentDetails.comment": 0,
         			"commentDetails.updatedAt": 0,
         			"commentDetails.createdAt": 0
         		}
         	},
         	{
         		$match: {
					$or: [
    					{ "postDetails.title": { $in: regex } },
      					{ "postDetails.desc": { $in: regex } }
    				]
  				}
         	}
		]).sort({createdAt: -1}).skip(skip).limit(limit)
		const allSavedPosts = await UserSavedPost.aggregate([
			{ $match: { "userId": req.user._id } },
			{
				$lookup: {
					from: "posts",
         			localField: "postId",    // field in the orders collection
         			foreignField: "_id",  // field in the items collection
         			as: "postDetails",
         		}
         	},
         	{
         		$unwind:'$postDetails'
         	},
         	{
         		$match: {
					$or: [
    					{ "postDetails.title": { $in: regex } },
      					{ "postDetails.desc": { $in: regex } }
    				]
  				}
         	}
		])
		const savedPostsCount = allSavedPosts.length
		res.status(200).send({savedPosts, savedPostsCount})
	} catch (e) {
		res.status(500).send(e)
	}
})

router.get('/savedPost/search/tag/:query/:page', auth, async (req, res) => {
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
		const savedPosts = await UserSavedPost.aggregate([
			{ $match: { "userId": req.user._id } },
			{
				$lookup: {
					from: "posts",
         			localField: "postId",    // field in the orders collection
         			foreignField: "_id",  // field in the items collection
         			as: "postDetails",
         		}
         	},
         	{
         		$unwind:'$postDetails'
         	},
			{
				$lookup: {
				from: "users",
         		localField: "postDetails.ownerId",    // field in the orders collection
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
         			localField: "postId",
         			foreignField: "postId",
         			as: "commentDetails"
         		}
         	},
         	{
         		$project: {
         			"postDetails._id": 0,
                	"postDetails.ownerId": 0,
                	"postDetails.createdAt": 0,
                	"postDetails.updatedAt": 0,
         			"userDetails._id": 0,
         			"userDetails.admin": 0,
         			"userDetails.banned": 0,
         			"userDetails.activationToken": 0,
         			"userDetails.email": 0,
         			"userDetails.password": 0,
         			"userDetails.tokens": 0,
         			"userDetails.updatedAt": 0,
         			"userDetails.createdAt": 0,
         			"commentDetails.ownerId": 0,
         			"commentDetails.postId": 0,
         			"commentDetails.read": 0,
         			"commentDetails.comment": 0,
         			"commentDetails.updatedAt": 0,
         			"commentDetails.createdAt": 0
         		}
         	},
         	{
         		$match: {
					$or: [
    					{ "postDetails.tags.tag": { $in: regex } }
    				]
  				}
         	}
		]).sort({createdAt: -1}).skip(skip).limit(limit)
		const allSavedPosts = await UserSavedPost.aggregate([
			{ $match: { "userId": req.user._id } },
			{
				$lookup: {
					from: "posts",
         			localField: "postId",    // field in the orders collection
         			foreignField: "_id",  // field in the items collection
         			as: "postDetails",
         		}
         	},
         	{
         		$unwind:'$postDetails'
         	},
         	{
         		$match: {
					$or: [
    					{ "postDetails.tags.tag": { $in: regex } }
    				]
  				}
         	}
		])
		const savedPostsCount = allSavedPosts.length
		res.status(200).send({savedPosts, savedPostsCount})
	} catch (e) {
		res.status(500).send(e)
	}
})

module.exports = router
