const route = require('express').Router()
const rolesController = require('../controllers/roles')
const userController = require('../controllers/users')
const postController = require('../controllers/post')

// Roles
route.post('/role', rolesController.createRole)
route.get('/role', rolesController.getRoles)
route.get('/role/:id', rolesController.getRole)
route.patch('/role/:id', rolesController.updateRole)
route.delete('/role/:id', rolesController.deleteRole)

// Users
route.post('/user/:role', userController.createUser)
route.get('/user', userController.getUsers)
route.get('/user/:id', userController.getUser)
route.put('/user/:id', userController.updateAll)
route.patch('/user/:id', userController.updatePartial)
route.patch('/user/password/:id', userController.updatePassword)
route.delete('/user/:id', userController.deleteUser)

// post
route.post('/post', postController.createPost)
route.get('/post', postController.getPosts)
route.get('/post/:id', postController.getPost)
route.get('/post/author/:id', postController.getAuthorPosts)
route.get('/post/author/:userId/:id', postController.getAuthorPost)
route.put('/post/:id', postController.updateAll)
route.patch('/post/:id', postController.updatePartial)
route.delete('/post/:id', postController.deletePost)

module.exports = route
