const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs/promises');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const filePath = 'data.json';
let version = 0;
const versionApp = '1.0.0';

app.use(bodyParser.json());

app.get('/', (req, res) => {
    //mostrar el archivo index.html
    res.sendFile(__dirname + '/index.html');
    // mostrar un mensaje de bienvenida en la ruta raíz
    // res.send('Bienvenido al servidor de actualizaciones');
});

app.get('/api/data', async (req, res) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        res.json({ version, data: JSON.parse(data) });
    } catch (error) {
        console.error('Error al leer el archivo JSON:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/app/version', async (req, res) => {
    try {
        const lastVersion = req.body.version;

        if (lastVersion != versionApp) {
            res.status(200).json({ versionApp: versionApp, url: 'https://www.youtube.com/gaaa', message: 'Actualización disponible' });
            res.statusMessage = 'Actualización disponible';
        } else {
            res.json({ message: 'No hay actualizaciones disponibles' });
        }
    } catch (error) {
        console.error('Error al leer el archivo JSON:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
        res.statusMessage = 'Error interno del servidor';
    }
});

app.post('/api/data', async (req, res) => {
    try {
        const newData = req.body.data;

        // Verificar si hay una actualización basada en la versión
        if (req.body.version > version) {
            version = req.body.version;
            await fs.writeFile(filePath, JSON.stringify(newData, null, 2), 'utf-8');

            // Emitir actualización a través de Socket.io
            io.emit('dataUpdated', { version, data: newData });

            res.json({ message: 'Datos actualizados correctamente' });
        } else {
            res.json({ message: 'No hay actualizaciones disponibles' });
        }
    } catch (error) {
        console.error('Error al escribir en el archivo JSON:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Configurar Socket.io para escuchar conexiones
io.on('connection', (socket) => {
    console.log('Cliente conectado');

    // Emitir datos actuales y versión al cliente cuando se conecta
    fs.readFile(filePath, 'utf-8')
        .then((data) => JSON.parse(data))
        .then((jsonData) => {
            socket.emit('initialData', { version, data: jsonData });
        })
        .catch((error) => {
            console.error('Error al enviar datos iniciales al cliente:', error);
        });

    // Manejar desconexiones de clientes
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

const port = 3000;

server.listen(port, () => {
    console.log(`Servidor Express.js en http://localhost:${port}`);
});
