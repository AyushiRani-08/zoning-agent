require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const port = process.env.PORT || 4000;

async function bootstrap() {
  await connectDB();
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

bootstrap();
