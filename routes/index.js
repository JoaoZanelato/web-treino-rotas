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
    try {
        // Renderiza a view 'index.ejs' que está dentro da pasta 'pages'
        res.render('pages/index', { title: 'Bem-vindo(a)!' });
    } catch (error) {
        next(error);
    }
});

/* GET e POST da página de Cadastro */
router.get('/register', isLoggedOut, (req, res, next) => {
    try {
        res.render('pages/register', { title: 'Cadastro' });
    } catch (error) {
        next(error);
    }
});

router.post('/register', isLoggedOut, async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        
        // Validações básicas
        if (!name || !email || !password) {
            return res.render('pages/register', { 
                title: 'Cadastro', 
                error: 'Todos os campos são obrigatórios.' 
            });
        }

        if (password.length < 6) {
            return res.render('pages/register', { 
                title: 'Cadastro', 
                error: 'A senha deve ter pelo menos 6 caracteres.' 
            });
        }

        // Verifica se o email já existe
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.render('pages/register', { 
                title: 'Cadastro', 
                error: 'Este email já está cadastrado.' 
            });
        }

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
        console.error('Erro no cadastro:', error);
        res.render('pages/register', { 
            title: 'Cadastro', 
            error: 'Ocorreu um erro interno. Tente novamente.' 
        });
    }
});

/* GET e POST da página de Login */
router.get('/login', isLoggedOut, (req, res, next) => {
    try {
        res.render('pages/login', { title: 'Login' });
    } catch (error) {
        next(error);
    }
});

// Usa a estratégia 'local' do Passport para autenticar
router.post('/login', isLoggedOut, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('pages/login', { 
                title: 'Login', 
                error: info.message || 'Email ou senha incorretos.' 
            });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

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
        
        res.render('pages/dashboard', { 
            title: 'Painel', 
            notes: notes 
        });
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        next(error); // Passa o erro para o handler de erro do app.js
    }
});

module.exports = router;