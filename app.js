const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const passport = require('passport');
const db = require('./models');

// Rotas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const notesRouter = require('./routes/notes');

const app = express();

// Sincroniza o banco de dados
db.sequelize.sync();

// Configuração da View Engine (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da Sessão
app.use(session({
    secret: 'um-segredo-muito-forte-para-proteger-a-sessao',
    store: new SequelizeStore({
        db: db.sequelize
    }),
    resave: false,
    saveUninitialized: false,
}));

// Configuração do Passport (autenticação)
require('./config/passport-config'); // Importa a configuração
app.use(passport.initialize());
app.use(passport.session());

// Middleware para passar dados do usuário para todas as views
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.user = req.user;
    next();
});

// Uso das Rotas
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/notes', notesRouter);

// Captura erro 404 e encaminha para o handler de erro
app.use(function(req, res, next) {
  next(createError(404));
});

// Handler de Erro
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;