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
            const pdfUrl = data('a[title="Ensalamento Noturno"]').attr('href');
           
            const pdfParser = await axios.get(pdfUrl, {
                responseType: 'arraybuffer'
            })

           
           
         
            
           
        
            
        }catch(error){
            res.status(500).json({ error: error.message });
        }
})