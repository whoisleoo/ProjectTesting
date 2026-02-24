import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PdfDataParser } from 'pdf-data-parser';


const CURSOS_MAP = {
    "Engenharia de Software":    "E.SOFT",
    "Administração":             "ADM",
    "Arquitetura e Urbanismo":   "ARQ",
    "Biomedicina":               "BIO",
    "Ciências Contábeis":        "CONT",
    "Direito":                   "DIR",
    "Enfermagem":                "ENF",
    "Engenharia Agronômica":     "E.AGRO",
    "Engenharia Civil":          "E.CIV",
    "Engenharia Elétrica":       "E.ELET",
    "Engenharia Mecânica":       "E.MEC",
    "Farmácia":                  "FARM",
    "Fisioterapia":              "FISIO",
    "Medicina Veterinária":      "M.VET",
    "Nutrição":                  "NUT",
    "Odontologia":               "ODT",
    "Psicologia":                "PSI",
    "Pedagogia":                 "PP"
};


const router = express.Router();

export default router;

router.get('/ensalamento', async (req, res) => {
  

        try{
            const { curso, periodo, turma } = req.query;
            const prefixo = CURSOS_MAP[curso];
            const moacir = `${prefixo}${periodo}${turma}`;

            const response = await axios.get("https://guarapuava.camporeal.edu.br/horarios-das-aulas/");

            const data = cheerio.load(response.data);
            let pdfUrl = null;
            data('.cerw-item-text').each((i, el) => {
                if (data(el).text().trim() === curso) {
                    pdfUrl = data(el).closest('a').attr('href');
                }
            });

            // res.status(200).json({sucesso: pdfUrl});

           
            const pdfParser = await axios.get(pdfUrl, {
                responseType: 'arraybuffer'
            })

           
            const parser = new PdfDataParser({
            data: new Uint8Array(pdfParser.data),
                 newlines: true,
                 lineHeight: 4.0,
                 trim: true
            });

           

            const rows = await parser.parse();
            const idx = rows.findIndex(row => row[0] === moacir);
            if(idx === -1) return res.status(404).json({ error: "Turma não encontrada" });

            // pega linhas do idx até o próximo título de turma
            const prefixos = Object.values(CURSOS_MAP);
            const ehTitulo = (row) => prefixos.some(p => row[0]?.startsWith(p));

            const secao = [];
            for(let i = idx; i < rows.length; i++) {
                if(i !== idx && ehTitulo(rows[i])) break;
                secao.push(rows[i]);
            }

            res.status(200).json({ secao });

           
            
        }catch(error){
            res.status(500).json({ error: error.message });
        }
})