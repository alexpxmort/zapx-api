const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();


const app = express();
const SESSION_FILE_PATH = 'session.json';
const PORT = process.env.PORT || 4000;


const client = new Client({
  puppeteer: {
    args: ['--no-sandbox'],
  },
});

// Carregar a sessão salva, se existir
try {
  const sessionData = require(SESSION_FILE_PATH);
  client.loadSession(sessionData);
} catch (err) {
  console.log('Não foi possível carregar a sessão:', err.message);
}

app.get('/zap', async (req, res) => {
  if (client.isReady) {
    try {
      await client.sendMessage('558788210009@c.us', 'FALA MARCAO SOU ROBO');
      return res.json({ ok: true });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error.message);
      return res.json({ ok: false, error: 'Erro ao enviar mensagem' });
    }
  } else {
    return res.json({ ok: false, error: 'O cliente não está pronto ainda' });
  }
});

app.listen(PORT, () => {
  console.log('Servidor ligado na porta 4000');
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Cliente pronto!');
  // Salvar a sessão para uso futuro
  fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(client.getSession()));
});

client.on('error', (err) => {
  console.error('Ocorreu um erro:', err);
});

client.initialize();
