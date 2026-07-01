import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth';
import { NavigationController } from '../controllers/navigationController';

const router = Router();
const navigationController = new NavigationController();

router.use(AuthMiddleware.authenticate);
router.get('/sidebar', (req, res, next) => navigationController.sidebar(req, res, next));

module.exports = router;
