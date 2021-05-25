const mongoose = require('mongoose');

mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

mongoose.connection.once('open', () => console.log("db connected"));

mongoose.connection.on('error', () => console.error.bind(console, 'connection error:'));