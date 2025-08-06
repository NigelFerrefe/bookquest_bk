// ℹ️ Gets access to environment variables/settings
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Express
const express = require("express");

// Import middleware and routes
const { isAuthenticated } = require("./middleware/jwt.middleware.js");
const indexRoutes = require("./routes/index.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const genreRoutes = require("./routes/genre.routes");
const bookRoutes = require("./routes/book.router");
const authorRoutes = require("./routes/author.routes");
const app = express();

app.use(express.json()); // para poder recibir JSON en el body

// Logger middleware para ver las peticiones
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
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
// Manejo de errores y rutas no encontradas
require("./error-handling")(app);

module.exports = app;
