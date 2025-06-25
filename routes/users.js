const express = require('express');
const router = express.Router();
const { User, Note } = require('../models');

// Middleware para garantir que o usuário está logado antes de acessar as rotas
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// --- ROTAS DE PERFIL ---

// GET - Exibe a página de perfil do usuário
router.get('/profile', isLoggedIn, (req, res) => {
    res.render('partials/profile', { title: 'Meu Perfil' });
});

// POST - Atualiza as informações do perfil do usuário
router.post('/profile', isLoggedIn, async (req, res, next) => {
    try {
        const { name, pronoun } = req.body;
        await User.update(
            { name, pronoun },
            { where: { id: req.user.id } }
        );
        res.redirect('/users/profile'); // Redireciona de volta para a página de perfil com as infos atualizadas
    } catch (error) {
        next(error);
    }
});

// POST - Deleta permanentemente o perfil do usuário e todas as suas anotações
router.post('/profile/delete', isLoggedIn, async (req, res, next) => {
    try {
        // A opção 'onDelete: CASCADE' na associação do modelo User->Note
        // garante que todas as anotações do usuário serão apagadas junto com ele.
        await User.destroy({ where: { id: req.user.id } });
        // Encerra a sessão do usuário
        req.logout(err => {
            if (err) {
                return next(err);
            }
            res.redirect('/');
        });
    } catch (error) {
        next(error);
    }
});


// --- ROTAS DA LIXEIRA ---

// GET - Exibe a página da lixeira com as anotações excluídas
router.get('/trash', isLoggedIn, async (req, res, next) => {
    try {
        const trashedNotes = await Note.findAll({
            where: {
                UserId: req.user.id,
                status: 'deleted' // Busca apenas as notas marcadas como 'deleted'
            },
            order: [['updatedAt', 'DESC']]
        });
        res.render('partials/trash', { title: 'Lixeira', notes: trashedNotes });
    } catch (error) {
        next(error);
    }
});

// POST - Restaura uma anotação da lixeira, mudando seu status para 'active'
router.post('/trash/:id/restore', isLoggedIn, async (req, res, next) => {
    try {
        await Note.update(
            { status: 'active' },
            { where: { id: req.params.id, UserId: req.user.id } }
        );
        res.redirect('/users/trash'); // Redireciona de volta para a lixeira
    } catch (error) {
        next(error);
    }
});

// POST - Exclui permanentemente uma anotação da lixeira
router.post('/trash/:id/delete', isLoggedIn, async (req, res, next) => {
    try {
        await Note.destroy({
            where: {
                id: req.params.id,
                UserId: req.user.id
            }
        });
        res.redirect('/users/trash'); // Redireciona de volta para a lixeira
    } catch (error) {
        next(error);
    }
});

module.exports = router;