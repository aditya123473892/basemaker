import { Router } from 'express';
import { SecurityController } from '../controllers/securityController';
import { AuthMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();
const securityController = new SecurityController();

router.use(AuthMiddleware.authenticate);

router.get('/registry', (req, res, next) => securityController.registry(req, res, next));
router.get('/me/permissions', (req, res, next) => securityController.effectivePermissions(req, res, next));

router.use(requirePermission('users.role_management', 'read'));

router.get('/roles', (req, res, next) => securityController.roles(req, res, next));
router.post('/roles', requirePermission('users.role_management', 'create'), (req, res, next) => securityController.createRole(req, res, next));
router.put('/roles/:id', requirePermission('users.role_management', 'update'), (req, res, next) => securityController.updateRole(req, res, next));
router.delete('/roles/:id', requirePermission('users.role_management', 'delete'), (req, res, next) => securityController.deleteRole(req, res, next));

router.get('/permissions', (req, res, next) => securityController.permissions(req, res, next));
router.get('/roles/:id/matrix', (req, res, next) => securityController.roleMatrix(req, res, next));
router.put('/roles/:id/matrix', requirePermission('users.role_management', 'update'), (req, res, next) => securityController.updateRoleMatrix(req, res, next));

router.get('/users', (req, res, next) => securityController.users(req, res, next));
router.post('/users/:userId/roles', requirePermission('users.role_management', 'update'), (req, res, next) => securityController.assignRole(req, res, next));
router.delete('/users/:userId/roles/:roleId', requirePermission('users.role_management', 'update'), (req, res, next) => securityController.removeRole(req, res, next));
router.get('/users/:userId/permissions', (req, res, next) => securityController.effectivePermissions(req, res, next));
router.get('/audit-logs', (req, res, next) => securityController.auditLogs(req, res, next));

module.exports = router;
