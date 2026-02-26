import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './src/routes/routes.js';

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.json('API IS NOW ONLINE');
});

app.use('/api', router);

app.listen(PORT, () => {
    console.log(`Server [REAL FINDER] is now online at port ${PORT}`);
});