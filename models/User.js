const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: 'Anonymous', // Optional: Default name
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  newPasswordToken: { 
    type: String 
  },
  newPasswordExpires: { 
    type: Date 
  }

});

const User = mongoose.model('User', userSchema);
module.exports = User;
