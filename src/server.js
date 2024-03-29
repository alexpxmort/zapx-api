const express = require('express');
const qrcode = require('qrcode');
const { Client, LocalAuth} = require('whatsapp-web.js');
const dotenv = require('dotenv');
const ejs = require('ejs');
const path = require('path');
const multer = require('multer');
const csvtojson = require('csvtojson');
const http = require('http');

let qrDataUrl = '';

dotenv.config();

const app = express();


const server = http.createServer(app);
const io = require('socket.io')(server);
const SESSION_FILE_PATH = 'session.json';
const PORT = process.env.PORT || 4000;

// Configurações do multer
const storage = multer.memoryStorage(); // Armazena o arquivo em memória
const upload = multer({ storage: storage });

// Função para converter o arquivo CSV em JSON
const csvToJSON = async (csvFileBuffer) => {
  const csvString = csvFileBuffer.toString('utf-8');

  // Usa csvtojson para converter o CSV em JSON
  const jsonData = await csvtojson().fromString(csvString);

  return jsonData;
};
// Função para enviar mensagens com base nos dados JSON e nas colunas selecionadas
const sendMessagesFromJSON = async (jsonData, message, selectedColumns) => {
  progress = { current: 0, total: jsonData.length };
  for (const [index, contact] of jsonData.entries()) {

    // Envia a mensagem concatenada para o número de telefone
    await client.sendMessage(`${contact.Phone}@c.us`, `${message}`);

    // Atualiza o progresso
    progress.current = index + 1;

    io.emit('progress', progress);

    // Aguarda 30 segundos antes do próximo envio
    if (index < jsonData.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 30 * 1000));
    }
  }
};


const client = new Client({
  authStrategy: new LocalAuth(
    {
      dataPath:'client'
    }
  ),
  puppeteer: {
    headless:'new',
    args: ['--no-sandbox'],
  },
});


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Boolean flag to track if the client is ready
let isClientReady = false;
let progress = { current: 0, total: 0 };






app.get('/zap', async (req, res) => {
  try {
    const { number, message } = req.query;
console.log(isClientReady)
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



// Rota para renderizar a página de envio de mensagem com CSV
app.get('/zap-csv', (req, res) => {
  return res.render('zap-csv', { error: null, success: null  });
});


// Configuração do Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.emit('progress', progress);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
app.post('/zap-csv', upload.single('csvFile'), async (req, res) => {
  try {
    const { message } = req.body;

    // Check if the client is ready
    if (isClientReady) {
      // Check if the required parameters are provided
      if ( !message) {
        return res.render('zap-csv', { error: 'mensagem é  obrigatória', success: null });
      }

      // Processar o arquivo CSV, se disponível
      const csvFile = req.file;
      if (csvFile) {
        // Converte o arquivo CSV em JSON
        const jsonData = await csvToJSON(csvFile.buffer);

        // Envia mensagens com base nos dados JSON
        await sendMessagesFromJSON(jsonData, message, []);

        return res.render('zap-csv', { success: 'Mensagens enviadas com sucesso', error: null  });
      } else {
        return res.render('zap-csv', { error: 'Arquivo CSV não fornecido', success: null  });
      }
    } else {
      return res.render('zap-csv', { error: 'O cliente não está pronto ainda', success: null  });
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error.message);
    return res.render('zap-csv', { error: 'Erro ao enviar mensagem', success: null  });
  }
});


app.get('/qr', (req, res) => {
  io.emit('isClientReady',isClientReady)

  if (qrDataUrl) {
    res.render('qr', { qrImage: qrDataUrl });
  } else {
    res.send('QR Code not generated yet');
  }
});



client.on('qr', async (qr) => {
  try {
    console.log(qr)
    qrDataUrl = await new Promise((resolve, reject) => {
      qrcode.toDataURL(qr, (err, dataUrl) => {
        if (err) {
          console.error('Error generating QR Code:', err);
          reject(err);
        } else {
          resolve(dataUrl);
        }
      });
    });

    
  } catch (err) {
    console.error('Error generating QR Code:', err);
  }
});

 
            





server.listen(PORT, () => {
  console.log(`Servidor ligado na porta ${PORT}`);
});

client.on('ready', () => {
  console.log('Cliente pronto!');
  // Set the flag to indicate that the client is ready
  isClientReady = true;
  io.emit('isClientReady',isClientReady)

   
  
});

client.on('error', (err) => {
  console.error('Ocorreu um erro:', err);
});

// Initialize the client after setting up event listeners
client.initialize();
