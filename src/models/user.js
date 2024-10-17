const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: [true, "Name is required"],
    },
    Mobilenumber: {
        type: Number,
        required: [true, "Mobile number is required"],
        unique: true, // Ensure mobile number is unique
    },
    Department: {
        type: String,
        required: [true, "Department is required"],
    },
    Dateofjoin: {
        type: String,
        required: [true, "Date of join is required"],
    },
    Photo: {
        type: String,
        required: [true, "Photo is required"] 
    }
});

// Define and export the User model
const User = mongoose.model('User', userSchema);
module.exports = User;
