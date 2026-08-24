const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function token(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

async function register(req, res) {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
    const [exists] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (exists.length) return res.status(409).json({ message: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users(name,email,password_hash,phone,role) VALUES(?,?,?,?, 'customer')",
      [name, email, hash, phone || null]
    );
    res.status(201).json({ message: "Registered successfully", userId: result.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const user = rows[0];
    res.json({ token: token(user), user: { id:user.id, name:user.name, email:user.email, role:user.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

module.exports = { register, login };
