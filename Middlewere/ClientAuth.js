const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET || "msofts"

const auth = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization")
    if (!authHeader) {
      return res.status(401).json({ error: "No Authorization header provided" })
    }

    const token = authHeader.replace("Bearer ", "")
    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" })
    }
    res.status(401).json({ error: "Please authenticate" })
  }
}

module.exports = auth

