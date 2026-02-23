const fs = require('fs');

const content = [
  "import express from 'express';",
  "import cors from 'cors';",
  "import router from './src/routes/routes.js';",
  "",
  "const PORT = process.env.PORT || 8080;",
  "const app = express();",
  "",
  "app.use(express.json());",
  "app.use(cors());",
  "",
  "app.get('/', (req, res) => {",
  "    res.json('API IS NOW ONLINE');",
  "});",
  "",
  "app.use('/api', router);",
  "",
  "app.listen(PORT, () => {",
  "    console.log(`Server [REAL FINDER] is now online at ${PORT}`);",
  "});",
].join('\n');

fs.writeFileSync('./server.js', content, { encoding: 'utf8' });
console.log('server.js reescrito em UTF-8 com sucesso!');
