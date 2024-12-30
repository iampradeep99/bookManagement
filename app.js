const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const booksRouter = require('./routes/book');
const indexRouter = require('./routes/index');

const requestLogger = require('./middleware/requestLogger');
const cache = require('./middleware/cache');
const http = require('http');
const socketIo = require('socket.io');  // Socket.IO for real-time communication

// Create the Express application
const app = express();

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server);  // Initialize Socket.IO

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(requestLogger);  

app.use('/books', booksRouter(io)); 
app.use('/', indexRouter)

app.use(express.static(path.join(__dirname, 'public')));

// Serve index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Serve the index.html
});
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;  // named pipe
  }
  if (port >= 0) {
    return port;  // port number
  }
  return false;
};

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;  // Export app for potential use in testing or other modules
