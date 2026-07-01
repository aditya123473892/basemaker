import { Router } from 'express';
import { TripController } from '../controllers/tripController';
import { AuthMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';

const router = Router();
const tripController = new TripController();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate);

// GET /api/trips - Get all trips for the company
router.get('/', requirePermission('TRIPS', 'VIEW'), (req, res, next) => tripController.getAllTrips(req, res, next));

// GET /api/trips/:id - Get trip by ID
router.get('/:id', requirePermission('TRIPS', 'VIEW'), (req, res, next) => tripController.getTripById(req, res, next));

// POST /api/trips - Create a new trip
router.post('/', requirePermission('TRIPS', 'CREATE'), (req, res, next) => tripController.createTrip(req, res, next));

// PUT /api/trips/:id - Update trip
router.put('/:id', requirePermission('TRIPS', 'UPDATE'), (req, res, next) => tripController.updateTrip(req, res, next));

// DELETE /api/trips/:id - Delete trip
router.delete('/:id', requirePermission('TRIPS', 'DELETE'), (req, res, next) => tripController.deleteTrip(req, res, next));

module.exports = router;
