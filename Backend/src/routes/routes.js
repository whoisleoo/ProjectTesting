import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fromPath } from "pdf2pic";
import { Poppler } from 'node-poppler';
import sharp from 'sharp';



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
    "Publicidade e Propaganda":                 "PP"
};


const router = express.Router();



export default router;

router.get('/ensalamento', async (req, res) => {
    const tempPdf = path.join(os.tmpdir(), `archive_${Date.now()}.pdf`);
    const tempTxt = path.join(os.tmpdir(), `archive_${Date.now()}.txt`);
    const tempImg = path.join(os.tmpdir(), `archive_${Date.now()}.png`);
    let resultado = null;
  

        try{
            const { curso, periodo, turma } = req.query;
            const prefixo = CURSOS_MAP[curso];
            const moacir = `${prefixo}${periodo}${turma}`;
            const moacir2 = `${prefixo}${periodo}`;
            const index = 0;

            const response = await axios.get("https://guarapuava.camporeal.edu.br/horarios-das-aulas/");

            const data = cheerio.load(response.data);
            let pdfUrl = null;
            data('.cerw-item-text').each((i, el) => {
                if (data(el).text().trim() === curso) {
                    pdfUrl = data(el).closest('a').attr('href');
                }
            });
            if(!pdfUrl){
                return res.status(404).json({error: "PDF was not found."})
            }

            const baixarPdf = await axios.get(pdfUrl, { responseType: 'arraybuffer'});
            fs.writeFileSync(tempPdf, Buffer.from(baixarPdf.data));

            const poppler = new Poppler();
            await poppler.pdfToText(tempPdf, tempTxt, { maintainLayout: true });
            const texto = fs.readFileSync(tempTxt, 'utf-8');
            const pages = texto.split('\f');
            if(pages.findIndex(i => i.includes(moacir))){
                const index = pages.findIndex(i => i.includes(moacir));
            }else if(pages.findIndex(i => i.includes(moacir2))){
                const index = pages.findIndex(i => i.includes(moacir2));

            }
            
                         
            if(index === -1){
                return res.status(404).json({ error: "Turma with this name was not found. "});
            }
            const pageLine = pages[index].split('\n');
            const moacirLine = pageLine.findIndex(i => i.includes(moacir || moacir2));

            if(pageLine.findIndex(i => i.includes(moacir))){
                const moacirLine = pageLine.findIndex(i => i.includes(moacir));
            }else if(pageLine.findIndex(i => i.includes(moacir2))){
                const moacirLine = pageLine.findIndex(i => i.includes(moacir2));

            }

            const ratio = moacirLine / pageLine.length;
           



            const options = {
                density: 300,
                saveFilename: "untitled",
                savePath: os.tmpdir(),
                format: "png",
                width: 1920, 
                height: 1500
              };

              const convert = fromPath(tempPdf, options);
              const pageToConvertAsImage = index + 1;
                resultado = await convert(pageToConvertAsImage);
              

              // aqui é onde corta o moacir no meio
              const metadados = await sharp(resultado.path).metadata();
              const estimatedTop = Math.floor(ratio * metadados.height);
              const cropTop = Math.max(0, estimatedTop - 10);
              const cropHeight = Math.min(Math.floor(metadados.height / 5), metadados.height - cropTop);
              const imgBuffer = await sharp(resultado.path).extract({
                left: 0,
                top: cropTop,
                width: Math.floor(metadados.width),
                height: cropHeight
              }).toBuffer();
              
              
              res.set('Content-Type', 'image/png');
              res.send(imgBuffer);
              


          
            // res.status(200).json({sucesso: pdfUrl});

       

           

            

        
           
            
        }catch(error){
            res.status(500).json({ error: error.message });
        } finally {
            if (fs.existsSync(tempPdf)) fs.unlinkSync(tempPdf);
            if (fs.existsSync(tempTxt)) fs.unlinkSync(tempTxt);
            if (resultado?.path && fs.existsSync(resultado.path)) fs.unlinkSync(resultado.path);
        }
})