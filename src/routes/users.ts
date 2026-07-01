import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { AuthMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();
const userController = new UserController();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate);

// GET /api/users - Get all users for the company
router.get('/', requirePermission('users.user_management', 'read'), (req, res, next) => userController.getAllUsers(req, res, next));

// GET /api/users/:id - Get user by ID
router.get('/:id', requirePermission('users.user_management', 'read'), (req, res, next) => userController.getUserById(req, res, next));

// POST /api/users - Create a new user
router.post('/', requirePermission('users.user_management', 'create'), (req, res, next) => userController.createUser(req, res, next));

// PUT /api/users/:id - Update user
router.put('/:id', requirePermission('users.user_management', 'update'), (req, res, next) => userController.updateUser(req, res, next));

// DELETE /api/users/:id - Delete user (soft delete)
router.delete('/:id', requirePermission('users.user_management', 'delete'), (req, res, next) => userController.deleteUser(req, res, next));

module.exports = router;
