import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

// POST /auth/signup
router.post('/signup', (req, res, next) => authController.signup(req, res, next));

// POST /auth/login
router.post('/login', (req, res, next) => authController.login(req, res, next));

module.exports = router;
