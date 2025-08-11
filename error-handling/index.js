module.exports = (app) => {
  // 404 - Not Found
  app.use((req, res, next) => {
    res.status(404).json({ message: "This route does not exist" });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error("ERROR", req.method, req.path, err);

    if (!res.headersSent) {

      if (err.status && err.message) {
        return res.status(err.status).json({ message: err.message });
      }

      // 401 - Token inválido o ausente (express-jwt)
      if (err.name === "UnauthorizedError") {
        return res.status(401).json({ message: "Invalid or missing token" });
      }

      // 403 - Acceso denegado (por ejemplo, desde checkRole)
      if (err.status === 403) {
        return res.status(403).json({ message: "Access denied" });
      }

      // 400 - Validación de datos (ej. mongoose o Joi)
      if (err.name === "ValidationError") {
        return res.status(400).json({ message: err.message });
      }

      // Otros errores
      res.status(500).json({
        message: "Internal server error. Check the server console",
      });
    }
  });
};
