const jwt = require("jsonwebtoken");
const User = require("../Models/User"); // Adjust the path as needed

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract user ID from the decoded token
    const userId = decoded.id;

    // Fetch user details using the ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach the user's email to the request object
    req.user = {
      email: user.email,
      role: user.role, // Assuming you also want to store the role
      id: user._id,
    };

    next(); // Proceed with the next middleware or route handler
  } catch (error) {
    console.error("Invalid token:", error);
    return res.status(403).json({ message: "Invalid token." });
  }
};

module.exports = authenticateToken;
