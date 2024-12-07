const mongoose = require('mongoose');

const connectionString = 'mongodb://atlas-sql-6667ebb2a6dbc46d4aedd584-op7ej.a.query.mongodb.net/mongodbVSCodePlaygroundDB?ssl=true&authSource=admin';

// เชื่อมต่อกับ MongoDB Atlas โดยใช้ Mongoose
mongoose.connect(connectionString, {
  user: '<6431501057>',
  pass: '<Code0963614833>',
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to the database');
});




