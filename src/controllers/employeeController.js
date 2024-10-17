const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary'); // Adjust the import according to your structure
const User = require('../models/user'); // Adjust the import according to your user model


// Add a new employee
exports.addEmployee = async (req, res) => {
    const { Name, Mobilenumber, Department, Dateofjoin } = req.body;

    // Check if there's a file uploaded
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a photo before proceeding.' });
    }

    try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);
        const photoUrl = result.secure_url; // Get the URL from the result

        const existingEmployee = await User.findOne({ Mobilenumber });
        if (existingEmployee) {
            return res.status(400).json({ error: 'Mobile number is already registered with another employee' });
        }

        const newEmployee = new User({ Name, Mobilenumber, Department, Dateofjoin, Photo: photoUrl });
        await newEmployee.save();

        res.status(201).json({ message: 'Employee added successfully' });
    } catch (error) {
        console.error('Error adding employee:', error);
        res.status(500).json({ error: 'Error adding employee' });
    }
};

// Get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await User.find({});
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching employees' });
    }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await User.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching employee' });
    }
};

// Update employee details
exports.updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { Name, Mobilenumber, Department, Dateofjoin } = req.body;

    try {
        let Photo;
        if (req.file) {
            // Upload new photo to Cloudinary if a new one is provided
            const result = await cloudinary.uploader.upload(req.file.path);
            Photo = result.secure_url;
        }

        const updatedEmployee = await User.findByIdAndUpdate(
            id,
            { Name, Mobilenumber, Department, Dateofjoin, Photo },
            { new: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(updatedEmployee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete an employee
exports.deleteEmployee = async (req, res) => {
    try {
        const result = await User.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).send('Employee not found');
        }
        res.send('Employee deleted');
    } catch (error) {
        res.status(500).send('Server error');
    }
};
