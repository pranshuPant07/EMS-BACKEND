const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: [true, "Name is required"],
    },
    Mobilenumber: {
        type: Number,
        required: [true, "Mobile number is required"],
        unique: true, // Ensure mobile number is unique
    },
    Username: {
        type: String,
        required: [true, "Username is required"],
        unique: true, // Ensure username is unique
    },
    Password: {
        type: String,
        required: [true, "Password is required"],
    },
});

// Define and export the Login model
const UserData = mongoose.model('userLoginData', loginSchema);
module.exports = UserData;
