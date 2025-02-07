const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
 email: {
   type: String,
   required: true,
   unique: true,
   lowercase: true,
   trim: true,
 },
 password: {
   type: String,
   required: true,
 },
 resetToken: {
   type: String,
   default: null, // Stores the password reset token
 },
 tokenExpiry: {
   type: Date,
   default: null, // Expiration time for the reset token
 },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
 if (!this.isModified("password")) return next();
 const salt = await bcrypt.genSalt(10);
 this.password = await bcrypt.hash(this.password, salt);
 next();
});

const User = mongoose.model("User", UserSchema);
export default User;
