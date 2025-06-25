'use strict';
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importa os modelos
db.User = require('./user.js')(sequelize, Sequelize);
db.Note = require('./note.js')(sequelize, Sequelize);

// Associações
db.User.hasMany(db.Note, { onDelete: 'CASCADE' });
db.Note.belongsTo(db.User);

module.exports = db;