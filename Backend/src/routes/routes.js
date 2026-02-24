import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PdfDataParser } from 'pdf-data-parser';



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

           
            const parser = new PdfDataParser({
                data: new Uint8Array(pdfParser.data),
                newlines: true,
                lineHeight: 1.67,
                trim: true
                        });

           

            const rows = await parser.parse();
            const idx = rows.findIndex(row => row[0]?.includes("ENG SOFT 01 C"));
            res.status(200).json({ rows: rows.slice(Math.max(0, idx - 2), idx + 8)  });

           
            
        }catch(error){
            res.status(500).json({ error: error.message });
        }
})