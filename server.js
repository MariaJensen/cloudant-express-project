const http = require('http');
const path = require('path');
const express = require('express');

const registerController = require('./controllers/registerController.js');
const loginController = require('./controllers/loginController.js');

const app = express(); 
// const staticFiles = express.static(path.join(__dirname, '../../client/build'));

// app.use(staticFiles);
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// ---- Routes: ----

app.post('/api/register', registerController);

app.post('/api/login', loginController);

app.use( (req, res, next) => {
    const err = new Error('Not found');
    err.status = 404;
    next(err);
}); 

app.use( (err, req, res, next) => {
    console.log('This is error handler');
    console.log('ERROR:');
    console.log(err);

    if (!err.status) {
        delete err.message;
        err.status = 500;
    }

    res.status(err.status);
    
    if (err.message) {
        res.write(err.message);
    }
    
    res.end();

    console.log('Error handler done');
});

// app.use('/*', staticFiles);

// ---- Server setup: ---- 

    function normalizePort(val) {
        const port = parseInt(val, 10);
        if (isNaN(port)) {return val;}
        if (port >= 0) {return port;}
        return false;
    };

    const port = normalizePort(process.env.PORT || '3001');
    app.set('port', port);


    function errorListener(error) {
        if (error.syscall !== 'listen') {throw error;}

        var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
            throw error;
        }
    }

    const server = http.createServer(app);

    server.on('listening', () => {
        console.log('Server listening');
    });

    server.on('error', errorListener);
    
    server.listen(port);
