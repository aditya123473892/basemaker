import { Router } from 'express';
import { DriverController } from '../controllers/driverController';
import { AuthMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();
const driverController = new DriverController();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate);

// GET /api/drivers - Get all drivers for the company
router.get('/', requirePermission('transport.drivers', 'read'), (req, res, next) => driverController.getAllDrivers(req, res, next));

// GET /api/drivers/:id - Get driver by ID
router.get('/:id', requirePermission('transport.drivers', 'read'), (req, res, next) => driverController.getDriverById(req, res, next));

// POST /api/drivers - Create a new driver
router.post('/', requirePermission('transport.drivers', 'create'), (req, res, next) => driverController.createDriver(req, res, next));

// PUT /api/drivers/:id - Update driver
router.put('/:id', requirePermission('transport.drivers', 'update'), (req, res, next) => driverController.updateDriver(req, res, next));

// DELETE /api/drivers/:id - Delete driver (soft delete)
router.delete('/:id', requirePermission('transport.drivers', 'delete'), (req, res, next) => driverController.deleteDriver(req, res, next));

module.exports = router;
