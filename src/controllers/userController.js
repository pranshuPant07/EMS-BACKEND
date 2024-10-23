const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Register a new user
exports.registerUser = async (req, res) => {
    const { Name, Username, Password, Mobilenumber } = req.body;

    if (!Mobilenumber || Mobilenumber.length < 10) {
        return res.status(401).json({ error: 'Mobile number must be at least 10 digits long' });
    }

    try {
        const existingUser = await User.findOne({
            $or: [{ Username }, { Mobilenumber }]
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username or mobile number already exists' });
        }

        const newUser = new User({ Name, Mobilenumber, Username, Password });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// User login
exports.loginUser = async (req, res) => {
    const { Username, Password } = req.body;

    try {
        const user = await User.findOne({ Username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.Password !== Password) { // Use a proper password comparison in production
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_TOKEN_KEY, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Fetch all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
};

// Fetch user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user' });
    }
};

// Update user details
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { Name, Mobilenumber, Department } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { Name, Mobilenumber, Department },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const result = await User.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).send('User not found');
        }
        res.send('User deleted');
    } catch (error) {
        res.status(500).send('Server error');
    }
};
