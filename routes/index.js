const express = require('express');
const router = express.Router();
const passport = require('passport');
const { User, Note } = require('../models');

// Middleware para proteger rotas
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

// Middleware para redirecionar se já estiver logado
function isLoggedOut(req, res, next) {
    if (!req.isAuthenticated()) return next();
    res.redirect('/dashboard');
}

/* GET Home Page */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Bem-vindo(a)!' });
});

/* GET/POST Cadastro */
router.get('/register', isLoggedOut, (req, res) => {
    res.render('register', { title: 'Cadastro' });
});

router.post('/register', isLoggedOut, async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = await User.create({ name, email, password_hash: password });
        req.login(user, (err) => {
            if (err) return next(err);
            return res.redirect('/dashboard');
        });
    } catch (error) {
        // Tratar erro de email duplicado, etc.
        res.render('register', { title: 'Cadastro', error: 'Ocorreu um erro. Tente novamente.' });
    }
});

/* GET/POST Login */
router.get('/login', isLoggedOut, (req, res) => {
    res.render('login', { title: 'Login' });
});

router.post('/login', isLoggedOut, passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: false // Você pode adicionar flash messages se quiser
}));

/* GET Logout */
router.get('/logout', isLoggedIn, (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

/* GET Dashboard */
router.get('/dashboard', isLoggedIn, async (req, res) => {
    try {
        const notes = await Note.findAll({ where: { UserId: req.user.id, status: 'active' } });
        res.render('dashboard', { title: 'Painel', notes: notes });
    } catch (error) {
        next(error);
    }
});

module.exports = router;