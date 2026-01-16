const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  zaps: { type: Number, default: 0 }
});

// Static helper to donate zapz to a user
userSchema.statics.donate = async function(username, amount) {
  return this.findOneAndUpdate(
    { username: username },
    { $inc: { zaps: amount } },
    { new: true }
  );
};

module.exports = mongoose.model('User', userSchema);