import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../db/conexao.js';
import { validarEmail } from '../middlewares/validation.js';

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
    }
});

router.post('/inscricao', async (req, res) => {
    const { email, curso, periodo, turma } = req.body;

    if (!email || !curso || !periodo || !turma) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }
    if (!validarEmail(email)) {
        return res.status(400).json({ error: 'Email inválido.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const linkCancelar = `${process.env.BASE_URL}/api/cancelar/${token}`;

    try {
        await pool.execute(
            'INSERT INTO inscritos (email, curso, periodo, turma, token) VALUES (?, ?, ?, ?, ?)',
            [email, curso, periodo, turma, token]
        );

        await transporter.sendMail({
            from: '"Campo Guia" <salabonita@gmail.com>',
            to: email,
            subject: 'Inscrição confirmada — Campo Guia',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:24px;border-radius:8px;">
                  <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:20px;">Inscrição confirmada</h1>
                  </div>
                  <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;">
                    <p style="color:#333;font-size:15px;">Você vai receber o ensalamento todo dia às <strong>08h</strong> para:</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                      <tr style="background:#f0f0f0;">
                        <td style="padding:8px 12px;font-weight:bold;color:#555;">Curso</td>
                        <td style="padding:8px 12px;color:#333;">${curso}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 12px;font-weight:bold;color:#555;">Período</td>
                        <td style="padding:8px 12px;color:#333;">${periodo}º</td>
                      </tr>
                      <tr style="background:#f0f0f0;">
                        <td style="padding:8px 12px;font-weight:bold;color:#555;">Turma</td>
                        <td style="padding:8px 12px;color:#333;">${turma}</td>
                      </tr>
                    </table>
                    <p style="color:#999;font-size:11px;text-align:center;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">
                      Não quer mais receber? <a href="${linkCancelar}" style="color:#555;">Cancelar inscrição</a>
                    </p>
                  </div>
                </div>
            `
        });

        return res.status(201).json({ message: 'Inscrição realizada com sucesso.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email já inscrito com esses dados.' });
        }
        return res.status(500).json({ error: err.message });
    }
});

router.get('/cancelar/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const [[inscrito]] = await pool.execute(
            'SELECT email, curso, periodo, turma FROM inscritos WHERE token = ?',
            [token]
        );

        if (!inscrito) {
            return res.status(404).send('<h2>Link inválido ou inscrição já cancelada.</h2>');
        }

        await pool.execute('DELETE FROM inscritos WHERE token = ?', [token]);

        await transporter.sendMail({
            from: '"Campo Guia" <salabonita@gmail.com>',
            to: inscrito.email,
            subject: 'Inscrição cancelada — Campo Guia',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:24px;border-radius:8px;">
                  <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:20px;">Inscrição cancelada</h1>
                  </div>
                  <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;">
                    <p style="color:#333;font-size:15px;">Sua inscrição foi removida. Você não receberá mais o ensalamento de <strong>${inscrito.curso}</strong>.</p>
                    <p style="color:#999;font-size:13px;">Se foi um engano, basta se cadastrar novamente no site.</p>
                  </div>
                </div>
            `
        });

        return res.send(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><title>Cancelado</title>
            <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#000;color:#e8e8e8;}
            .box{text-align:center;padding:40px;border:1px solid #1f1f1f;border-radius:12px;background:#0d0d0d;}</style>
            </head>
            <body><div class="box"><h2>Inscrição cancelada.</h2><p>Você não receberá mais o ensalamento diário.</p></div></body>
            </html>
        `);
    } catch (err) {
        return res.status(500).send('<h2>Erro interno. Tente novamente.</h2>');
    }
});

export default router;
