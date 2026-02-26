import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fromPath } from "pdf2pic";
import { Poppler } from 'node-poppler';
import sharp from 'sharp';
import nodemailer from 'nodemailer';
import { validarEmail } from '../middlewares/validation.js';





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
            const { curso, periodo, turma, email } = req.query;
            const prefixo = CURSOS_MAP[curso];
            const moacir = `${prefixo}${periodo}${turma}`;
            const moacir2 = `${prefixo}${periodo}`;
            let index = -1;

           

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
            if(pages.findIndex(i => i.includes(moacir)) !== -1){
                index = pages.findIndex(i => i.includes(moacir));
            }else if(pages.findIndex(i => i.includes(moacir2)) !== -1){
                index = pages.findIndex(i => i.includes(moacir2));

            }


            if(index === -1){
                return res.status(404).json({ error: "Turma with this name was not found. "});
            }
            const pageLine = pages[index].split('\n');
            let moacirLine = -1;

            if(pageLine.findIndex(i => i.includes(moacir)) !== -1){
                moacirLine = pageLine.findIndex(i => i.includes(moacir));
            }else if(pageLine.findIndex(i => i.includes(moacir2)) !== -1){
                moacirLine = pageLine.findIndex(i => i.includes(moacir2));

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
              
              const transporter = nodemailer.createTransport({
                service: 'gmail',   
                auth: {
                  user: process.env.GMAIL_EMAIL,
                  pass: process.env.GMAIL_PASSWORD, 
                }
              })
              
              if(email){
                if (!validarEmail(email)) {
                    return res.status(400).json({ error: "Email tá incorreto" });
                }

                await transporter.sendMail({
                    from: '"Ensalamento" <salabonita@gmail.com>',
                    to: email,
                    subject: `Ensalamento - ${curso}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 24px; border-radius: 8px;">
                        <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Ensalamento</h1>
                        </div>
                  
                        <div style="background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px;">
                          <p style="color: #333; font-size: 15px;">Olá! Segue o ensalamento para:</p>
                  
                          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                            <tr style="background: #f0f0f0;">
                              <td style="padding: 8px 12px; font-weight: bold; color: #555;">Curso</td>
                              <td style="padding: 8px 12px; color: #333;">${curso}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 12px; font-weight: bold; color: #555;">Período</td>
                              <td style="padding: 8px 12px; color: #333;">${periodo}º</td>
                            </tr>
                            <tr style="background: #f0f0f0;">
                              <td style="padding: 8px 12px; font-weight: bold; color: #555;">Turma</td>
                              <td style="padding: 8px 12px; color: #333;">${turma}</td>
                            </tr>
                          </table>
                  
                          <div style="text-align: center; margin: 24px 0;">
                            <img src="cid:ensalamento_img" style="max-width: 100%; border-radius: 6px; border: 1px solid #ddd;" />
                          </div>
                  
                          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
                            Campo Real — Gerado pela API bonita
                          </p>
                        </div>
                      </div>
                    `,
                    attachments: [
                      {
                        filename: 'ensalamento.png',
                        content: imgBuffer,
                        contentType: 'image/png',
                        cid: 'ensalamento_img', 
                      }
                    ]
                  });

                  return res.status(200).json({ message: `Email enviado a ${email}` });

            }

              
              
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