const express = require('express');
const crypto = require('crypto');
const app = express();
const TelegramBot = require('node-telegram-bot-api');

const telegramBotToken = '8102052298:AAEdJ5A8VC5QMWzci4rFUMOqbl319n_T11A';
const bot = new TelegramBot(telegramBotToken, { polling: true });

// Armazenamento temporário de tokens
const tokens = {};

// Endpoint para gerar token
app.get('/generate-token', (req, res) => {
    const userId = req.query.userId;
    const token = crypto.randomBytes(16).toString('hex');
    tokens[userId] = token;
    res.json({ token });
});

// Endpoint para verificar token
app.get('/verify-token', (req, res) => {
    const userId = req.query.userId;
    const token = req.query.token;

    if (tokens[userId] === token) {
        res.json({ valid: true });
    } else {
        res.json({ valid: false });
    }
});

// Bot do Telegram
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Verificar se o usuário é membro do grupo
    bot.getChatMember('-1002178729694', userId).then((member) => {
        if (member.status === 'member' || member.status === 'administrator' || member.status === 'creator') {
            // Gerar token único
            const token = crypto.randomBytes(16).toString('hex');
            tokens[userId] = token;

            // Enviar link de retorno para a aplicação
            bot.sendMessage(chatId, `Clique no link para retornar à aplicação: https://drop2-theta.vercel.app/?telegram_user_id=${userId}&token=${token}`);
        } else {
            bot.sendMessage(chatId, "Você não é membro do grupo.");
        }
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});