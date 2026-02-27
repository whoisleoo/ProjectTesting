import cron from 'node-cron';
import nodemailer from 'nodemailer';
import pool from './db/conexao.js';
import { gerarImagem } from './routes/routes.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
    }
});

async function enviarParaInscritos() {
    const [inscritos] = await pool.execute('SELECT * FROM inscritos');

    for (const manga of inscritos) {
        try {
            const imgBuffer = await gerarImagem(manga.curso, manga.periodo, manga.turma);
            const linkCancelar = `${process.env.BASE_URL}/api/cancelar/${manga.token}`;

            await transporter.sendMail({
                from: '"Ensalamento Diário" <salabonita@gmail.com>',
                to: manga.email,
                subject: `Ensalamento de hoje — ${manga.curso}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 24px; border-radius: 8px;">
                      <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Ensalamento de hoje</h1>
                      </div>
                      <div style="background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px;">
                        <p style="color: #333; font-size: 15px;">Olá! Segue o ensalamento de hoje para:</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                          <tr style="background: #f0f0f0;">
                            <td style="padding: 8px 12px; font-weight: bold; color: #555;">Curso</td>
                            <td style="padding: 8px 12px; color: #333;">${manga.curso}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 12px; font-weight: bold; color: #555;">Período</td>
                            <td style="padding: 8px 12px; color: #333;">${manga.periodo}º</td>
                          </tr>
                          <tr style="background: #f0f0f0;">
                            <td style="padding: 8px 12px; font-weight: bold; color: #555;">Turma</td>
                            <td style="padding: 8px 12px; color: #333;">${manga.turma}</td>
                          </tr>
                        </table>
                        <div style="text-align: center; margin: 24px 0;">
                          <img src="cid:ensalamento_img" style="max-width: 100%; border-radius: 6px; border: 1px solid #ddd;" />
                        </div>
                        <p style="color: #999; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
                          Não quer mais receber? <a href="${linkCancelar}" style="color:#555;">Cancelar inscrição</a>
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

            console.log(`[agendador] Email enviado para ${manga.email}`);
        } catch (err) {
            console.error(`[agendador] Falha ao enviar para ${manga.email}: ${err.message}`);
        }
    }
}

cron.schedule('0 8 * * *', () => {
    console.log('[agendador] Disparando envio diário...');
    enviarParaInscritos();
}, { timezone: 'America/Sao_Paulo' });

console.log('[agendador] Cron registrado — 08:00 (America/Sao_Paulo)');
