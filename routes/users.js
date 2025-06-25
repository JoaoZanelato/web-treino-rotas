const express = require('express');
const router = express.Router();
const { User, Note } = require('../models');

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

// GET - Página de perfil
router.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile', { title: 'Meu Perfil' });
});

// POST - Editar perfil
router.post('/profile', isLoggedIn, async (req, res) => {
    const { name, pronoun } = req.body;
    await User.update({ name, pronoun }, { where: { id: req.user.id } });
    res.redirect('/dashboard');
});

// POST - Deletar perfil
router.post('/profile/delete', isLoggedIn, async (req, res) => {
    await User.destroy({ where: { id: req.user.id } });
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/');
    });
});

// GET - Lixeira
router.get('/trash', isLoggedIn, async (req, res) => {
    const notes = await Note.findAll({ where: { UserId: req.user.id, status: 'deleted' } });
    res.render('trash', { title: 'Lixeira', notes });
});

// POST - Restaurar da lixeira
router.post('/trash/:id/restore', isLoggedIn, async (req, res) => {
    await Note.update({ status: 'active' }, { where: { id: req.params.id, UserId: req.user.id } });
    res.redirect('/users/trash');
});

// POST - Deletar permanentemente
router.post('/trash/:id/delete', isLoggedIn, async (req, res) => {
    await Note.destroy({ where: { id: req.params.id, UserId: req.user.id } });
    res.redirect('/users/trash');
});

module.exports = router;