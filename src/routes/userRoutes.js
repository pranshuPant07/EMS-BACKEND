const express = require('express');
const router = express.Router();
const { upload, uploadForExcel } = require('../middleware/upload');

// Import controllers
const authController = require('../controllers/authController');
const employeeController = require('../controllers/employeeController');
const userController = require('../controllers/userController');
const excelController = require('../controllers/excelController');

// Authentication routes
router.post('/api/register', authController.register);
router.get('/', authController.check);
router.post('/api/login', authController.login);
router.post('/api/verify', authController.verify);
router.post('/api/logout', authController.logout);

// Employee routes
router.post('/api/addEmployee', upload.single('photo'), employeeController.addEmployee);
router.get('/api/employees', employeeController.getAllEmployees);
router.get('/api/employees/:id', employeeController.getEmployeeById);
router.put('/api/employees/:id', upload.single('photo'), employeeController.updateEmployee);
router.delete('/api/employees/:id', employeeController.deleteEmployee);


// Excel-related routes
router.post('/upload', uploadForExcel.single('file'), excelController.uploadExcel);
router.get('/export/employees', excelController.exportEmployees);
router.get('/export/downloadEmpl', excelController.downloadEmpl)

module.exports = router;