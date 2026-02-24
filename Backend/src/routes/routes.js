import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';


const router = express.Router();

export default router;

router.get('/ensalamento', async (req, res) => {
        try{
            const { curso, periodo } = req.query;

            const response = await axios.get("https://guarapuava.camporeal.edu.br/ensalamento/");

            const data = cheerio.load(response.data);
            if(data('a[title="Ensalamento Noturno]').attr('href')){
                res.status(200).json({ message: "sucesso, retornou true."})
            }else{
                res.status(404).json({ message: "erro, retornou false."})
                
            }

            
        }catch(error){
            res.status(500).json({ error: error.message });
        }
})