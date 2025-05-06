const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  index: {
    type: String,
    unique: true,
    required: true,
  },
  emailCipher: {
    iv: { type: String, required: true },
    ct: { type: String, required: true },
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  newPasswordToken: {
    type: String,
  },
  newPasswordExpires: {
    type: Date,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
