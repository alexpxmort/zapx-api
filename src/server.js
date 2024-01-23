const express = require('express');
const qrcode = require('qrcode');
const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const dotenv = require('dotenv');
const ejs = require('ejs');
const path = require('path');

dotenv.config();

const app = express();
const SESSION_FILE_PATH = 'session.json';
const PORT = process.env.PORT || 4000;

const client = new Client({
  puppeteer: {
    args: ['--no-sandbox'],
  },
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Boolean flag to track if the client is ready
let isClientReady = false;
// ... (same as before)

app.get('/zap', async (req, res) => {
  try {
    const { number, message } = req.query;

    // Check if the client is ready
    if (isClientReady) {
      // Check if the required parameters are provided
      if (!number || !message) {
        return res.render('zap', { error: 'Número e mensagem são obrigatórios',sucess:null  });
      }

      // Send a message
      await client.sendMessage(`${number}@c.us`, message);

      return res.render('zap', { success: 'Mensagem enviada com sucesso', number,error:null  });
    } else {
      return res.render('zap', { error: 'O cliente não está pronto ainda',sucess:null  });
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error.message);
    return res.render('zap', { error: 'Erro ao enviar mensagem',sucess:null });
  }
});


app.get('/qr', async (req, res) => {
  try {
    let qr = await new Promise((resolve, reject) => {
      client.once('qr', (qr) => {
        qrcode.toDataURL(qr, (err, dataUrl) => {
          if (err) {
            console.error('Erro ao gerar QR Code:', err);
            return res.status(500).send('Erro ao gerar QR Code');
          } else {
            res.render('qr', { qrImage: dataUrl });
            resolve(); // Resolve a promessa após renderizar
          }
        });
      });
      setTimeout(() => {
        reject(new Error("QR event wasn't emitted in 15 seconds."));
      }, 120000);
    });
  } catch (err) {
    res.send(err.message);
  }
});





app.listen(PORT, () => {
  console.log(`Servidor ligado na porta ${PORT}`);
});

client.on('ready', () => {
  console.log('Cliente pronto!');
  // Set the flag to indicate that the client is ready
  isClientReady = true;

   
  
});

client.on('error', (err) => {
  console.error('Ocorreu um erro:', err);
});

// Initialize the client after setting up event listeners
client.initialize();
