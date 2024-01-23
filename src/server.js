const express = require('express');
const qrcode = require('qrcode');
const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const dotenv = require('dotenv');
const ejs = require('ejs');

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

app.set('view engine', ejs); // Configura o mecanismo de visualização EJS

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

app.get('/qr', (req, res) => {
  if (client.isReady) {
    const qr = client.generateInviteCode();
    qrcode.toDataURL(qr, (err, dataUrl) => {
      if (err) {
        console.error('Erro ao gerar QR Code:', err);
        res.status(500).send('Erro ao gerar QR Code');
      } else {
        // Renderiza a página HTML com o QR Code
        res.render('qr', { qrImage: dataUrl });
      }
    });
  } else {
    res.status(500).send('O cliente não está pronto ainda');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor ligado na porta ${PORT}`);
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
