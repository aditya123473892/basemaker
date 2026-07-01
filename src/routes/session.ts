import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth';
import { SessionController } from '../controllers/sessionController';

const router = Router();
const sessionController = new SessionController();

router.use(AuthMiddleware.authenticate);
router.get('/bootstrap', (req, res, next) => sessionController.bootstrap(req, res, next));

module.exports = router;
