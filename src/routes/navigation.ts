import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';
import { NavigationController } from '../controllers/navigationController';

const router = Router();
const navigationController = new NavigationController();

router.use(AuthMiddleware.authenticate);
router.get('/sidebar', (req, res, next) => navigationController.sidebar(req, res, next));

router.use(requirePermission('system.navigation', 'read'));
router.get('/menus', (req, res, next) => navigationController.listMenus(req, res, next));
router.post('/menus', requirePermission('system.navigation', 'create'), (req, res, next) => navigationController.createMenu(req, res, next));
router.put('/menus/:id', requirePermission('system.navigation', 'update'), (req, res, next) => navigationController.updateMenu(req, res, next));
router.delete('/menus/:id', requirePermission('system.navigation', 'delete'), (req, res, next) => navigationController.deleteMenu(req, res, next));

module.exports = router;
