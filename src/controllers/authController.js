const userData = require('../models/user');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const UserData = require('../models/login');

// Register a new user
exports.register = async (req, res) => {
  const { Name, Username, Password, Mobilenumber } = req.body;

  // Validate mobile number
  if (!Mobilenumber || Mobilenumber.length < 10) {
    return res.status(400).json({ error: 'Mobile number must be at least 10 digits long' });
  }

  try {
    // Check if the username or mobile number already exists
    const existingUser = await userData.findOne({
      $or: [{ Username }, { Mobilenumber }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or mobile number already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Save the new user
    const newUser = new UserData({ Name, Mobilenumber, Username, Password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Login a user
exports.login = async (req, res) => {
  const { Username, Password } = req.body;

  try {
    const user = await UserData.findOne({ Username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(Password, user.Password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_TOKEN_KEY, { expiresIn: '1h' });
    res.json({ token });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send(error.message);
  }
};

// Verify a user (dummy verification logic)
exports.verify = async (req, res) => {
  const { code } = req.body;
  const verificationCode = "1234";

  // Check if the code is provided
  if (!code) {
    return res.status(400).send({ message: "Enter verification code first" });
  } else if( code.length < 4){
    return res.status(400).send({message: "Code must be 4 digits"})
  }

  // Check if the code matches the expected verification code
  if (code === verificationCode) {
    return res.sendStatus(200);
  }

  // If the code does not match
  return res.status(401).send({ message: "Verification failed" });
};

// Logout a user
exports.logout = async (req, res) => {
  // In a real application, you might want to implement token blacklisting
  res.json({ message: 'Logged out successfully' });
};
