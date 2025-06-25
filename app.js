const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const passport = require('passport');
const db = require('./models');

// Importação das rotas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const notesRouter = require('./routes/notes');

const app = express();

// Sincroniza o banco de dados (cria as tabelas se não existirem)
db.sequelize.sync();

// Configuração da View Engine (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares padrão
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Essencial para o CSS funcionar

// Configuração da Sessão
app.use(session({
    secret: 'um-segredo-muito-forte-para-proteger-a-sessao',
    store: new SequelizeStore({
        db: db.sequelize
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true apenas em HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Configuração do Passport (autenticação)
require('./config/passport-config'); // Importa a lógica de configuração do Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware para passar dados do usuário para todas as views (ex: nome do usuário no header)
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.user = req.user || null;
    next();
});

// Uso das Rotas
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/notes', notesRouter);

// Captura erro 404 (página não encontrada) e encaminha para o handler de erro
app.use(function(req, res, next) {
    next(createError(404));
});

// Handler de Erro (Versão corrigida e melhorada)
app.use(function(err, req, res, next) {
    // Define variáveis locais para a view de erro
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    
    // Define o status da resposta (ex: 404, 500)
    res.status(err.status || 500);
    
    // Log do erro para debugging
    console.error('Erro capturado:', {
        status: err.status || 500,
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });

    // Renderiza a página de erro
    try {
        res.render('pages/error', {
            title: 'Erro ' + (err.status || 500),
            error: res.locals.error,
            message: res.locals.message
        });
    } catch (renderError) {
        // Fallback caso a renderização da página de erro falhe
        console.error('Erro ao renderizar página de erro:', renderError);
        res.send(`
            <h1>Erro ${err.status || 500}</h1>
            <p>${err.message}</p>
            <a href="/">Voltar para a página inicial</a>
        `);
    }
});

module.exports = app;