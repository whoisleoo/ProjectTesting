import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './src/routes/routes.js';
import inscricaoRouter from './src/routes/inscricao.js';
import './src/agendador.js';

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }));

app.get('/', (req, res) => {
    res.json('API IS NOW ONLINE');
});

app.use('/api', router);
app.use('/api', inscricaoRouter);

app.listen(PORT, () => {
    console.log(`Server [REAL FINDER] is now online at port ${PORT}`);
});
