import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor Express 5 escuchando en el puerto ${PORT}`);
  console.log(`📡 URL Base: http://localhost:${PORT}/api/health`);
});
