const express = require('express');
const app = express();

// Middleware (si tienes JSON o CORS)
app.use(express.json());

// Rutas de ejemplo
app.get('/', (req, res) => {
  res.send('¡Hola desde Render!');
});

// 🔴 IMPORTANTE: Render usa process.env.PORT
const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
