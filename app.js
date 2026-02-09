// ℹ️ Gets access to environment variables/settings
require("dotenv").config();

// ℹ️ Connects to the database
const { connectDB } = require("./db");

// Express
const express = require("express");

// Import middleware and routes
const { isAuthenticated } = require("./middleware/jwt.middleware.js");
const indexRoutes = require("./routes/index.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const genreRoutes = require("./routes/genre.routes");
const bookRoutes = require("./routes/book.routes");
const authorRoutes = require("./routes/author.routes");
const googleBooksRoutes = require("./routes/googleBooks.route");
const app = express();

app.use(express.json()); // para poder recibir JSON en el body

// Logger middleware para ver las peticiones
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware to ensure DB connection before processing requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('❌ Database connection failed in middleware:', error.message);
    res.status(503).json({ 
      error: 'Service temporarily unavailable', 
      message: 'Unable to establish database connection',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Middleware global o configuración extra
require("./config")(app);

// Rutas
app.use("/api", indexRoutes);
app.use("/auth", authRoutes);
app.use("/api/user", isAuthenticated, userRoutes); // protege las rutas user con isAuthenticated
app.use("/api/genre", isAuthenticated, genreRoutes);
app.use("/api/book", isAuthenticated, bookRoutes);
app.use("/api/author", isAuthenticated, authorRoutes);
app.use("/api/book/wishlist", isAuthenticated, bookRoutes);
app.use("/api/book/purchased", isAuthenticated, bookRoutes);
app.use("/api/book/favorites", isAuthenticated, bookRoutes);
app.use("/api/google-books", isAuthenticated, googleBooksRoutes);
// Manejo de errores y rutas no encontradas
require("./error-handling")(app);

module.exports = app;
