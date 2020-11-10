const route = require('express').Router()
const publicController = require('../controllers/public')
const postController = require('../controllers/post')

// Users
route.get('/user', publicController.getUsers)
route.get('/user/:id', publicController.getUser)

// Post
route.get('/post', postController.getPosts)
route.get('/post/:id', postController.getPost)
route.get('/post/author/:id', postController.getAuthorPosts)
route.get('/post/author/:userId/:id', postController.getAuthorPost)

module.exports = route
