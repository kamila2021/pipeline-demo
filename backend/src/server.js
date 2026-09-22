import app from './app.js';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Servidor Express 5 escuchando');
  logger.info({ url: `http://localhost:${PORT}/api/health` }, 'URL Base disponible');
});
