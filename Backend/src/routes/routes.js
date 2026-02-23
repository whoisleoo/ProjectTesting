import express from 'express';
import axios from 'axios';

const router = express.Router();

export default router;

router.get('/ensalamento', async (req, res) => {
        try{
            const { curso, periodo } = req.query;

            const response = await axios.get("https://guarapuava.camporeal.edu.br/ensalamento/");

            res.json({
                html: response.data
            })
        }catch(error){
            res.status(500).json({ error: error.message });
        }
})