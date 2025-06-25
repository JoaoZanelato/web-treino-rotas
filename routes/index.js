const express = require('express');
const router = express.Router();
const passport = require('passport');
const { User, Note } = require('../models');

// Middleware para verificar se o usuário está logado
// Se não estiver, redireciona para a página de login
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Middleware para verificar se o usuário já está logado
// Se estiver, redireciona para o painel principal para evitar que ele veja as páginas de login/cadastro
function isLoggedOut(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/dashboard');
}

/* GET Home Page (Página Inicial) */
router.get('/', (req, res, next) => {
  // Renderiza a view 'index.ejs' que está dentro da pasta 'partials'
  res.render('partials/index', { title: 'Bem-vindo(a)!' });
});

/* GET e POST da página de Cadastro */
router.get('/register', isLoggedOut, (req, res) => {
    res.render('partials/register', { title: 'Cadastro' });
});

router.post('/register', isLoggedOut, async (req, res, next) => {
    const { name, email, password } = req.body;
    try {
        // O hook no modelo 'user.js' vai cuidar de fazer o hash da senha
        const user = await User.create({ name, email, password_hash: password });
        // Faz o login do usuário recém-criado automaticamente
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/dashboard');
        });
    } catch (error) {
        // Em caso de erro (ex: email já existe), renderiza a página de cadastro novamente
        // Idealmente, você passaria uma mensagem de erro aqui
        res.render('partials/register', { title: 'Cadastro', error: 'Ocorreu um erro. Tente novamente.' });
    }
});

/* GET e POST da página de Login */
router.get('/login', isLoggedOut, (req, res) => {
    res.render('partials/login', { title: 'Login' });
});

// Usa a estratégia 'local' do Passport para autenticar
router.post('/login', isLoggedOut, passport.authenticate('local', {
    successRedirect: '/dashboard', // Em caso de sucesso, vai para o painel
    failureRedirect: '/login',     // Em caso de falha, volta para a página de login
    failureFlash: false            // Pode ser ativado para mostrar mensagens de erro com 'connect-flash'
}));

/* GET Logout */
router.get('/logout', isLoggedIn, (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

/* GET Dashboard (Painel Principal) */
router.get('/dashboard', isLoggedIn, async (req, res, next) => {
    try {
        // Busca todas as anotações do usuário logado que não estão na lixeira
        const notes = await Note.findAll({
            where: {
                UserId: req.user.id,
                status: 'active'
            },
            order: [['updatedAt', 'DESC']] // Ordena pelas mais recentes
        });
        res.render('partials/dashboard', { title: 'Painel', notes: notes });
    } catch (error) {
        next(error); // Passa o erro para o handler de erro do app.js
    }
});

module.exports = router;