import express from 'express';
import * as StudentsController from '../controllers/students.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes with JWT verification
router.use(verifyToken);

// Student Routes
router.get('/', StudentsController.getStudents);
router.get('/stats', StudentsController.getStudentStats);
router.get('/:id', StudentsController.getStudentById);
router.get('/:id/transactions', StudentsController.getStudentTransactions);
router.put('/:id', StudentsController.updateStudent);
router.patch('/:id/toggle-status', StudentsController.toggleStudentStatus);

export default router;
