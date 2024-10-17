const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// Import controllers
const authController = require('../controllers/authController');
const employeeController = require('../controllers/employeeController');
const userController = require('../controllers/userController');
const excelController = require('../controllers/excelController');

// Authentication routes
router.post('/api/register', authController.register);
router.post('/api/login', authController.login);
router.post('/api/verify', authController.verify);
router.post('/api/logout', authController.logout);

// Employee routes
router.post('/api/addEmployee', upload.single('photo'), employeeController.addEmployee);
router.get('/api/employees', employeeController.getAllEmployees);
router.get('/api/employees/:id', employeeController.getEmployeeById);
router.put('/api/employees/:id',upload.single('photo'), employeeController.updateEmployee);
router.delete('/api/employees/:id', employeeController.deleteEmployee);

// User routes (if needed)
router.get('/api/users', userController.getAllUsers);
router.get('/api/users/:id', userController.getUserById);

// Excel-related routes
router.post('/upload', excelController.uploadExcel);
router.get('/export/employees', excelController.exportEmployees);

module.exports = router;
