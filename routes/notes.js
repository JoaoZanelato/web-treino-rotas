const express = require('express');
const router = express.Router();
const { Note } = require('../models');
const md = require('markdown-it')();
const { Op } = require('sequelize');

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

// GET - Formulário de criação
router.get('/create', isLoggedIn, (req, res) => {
    res.render('note_form', { title: 'Nova Anotação', note: null });
});

// POST - Criar anotação
router.post('/create', isLoggedIn, async (req, res) => {
    const { title, content } = req.body;
    await Note.create({ title, content, UserId: req.user.id });
    res.redirect('/dashboard');
});

// GET - Detalhes da anotação com Markdown
router.get('/:id', isLoggedIn, async (req, res) => {
    const note = await Note.findOne({ where: { id: req.params.id, UserId: req.user.id } });
    if (note) {
        const renderedContent = md.render(note.content || '');
        res.render('note_detail', { title: note.title, note, renderedContent });
    } else {
        res.status(404).send('Anotação não encontrada');
    }
});

// GET - Formulário de edição
router.get('/:id/edit', isLoggedIn, async (req, res) => {
    const note = await Note.findOne({ where: { id: req.params.id, UserId: req.user.id } });
    res.render('note_form', { title: 'Editar Anotação', note });
});

// POST - Atualizar anotação
router.post('/:id/edit', isLoggedIn, async (req, res) => {
    const { title, content } = req.body;
    await Note.update({ title, content }, { where: { id: req.params.id, UserId: req.user.id } });
    res.redirect('/dashboard');
});

// POST - Mover para a lixeira
router.post('/:id/delete', isLoggedIn, async (req, res) => {
    await Note.update({ status: 'deleted' }, { where: { id: req.params.id, UserId: req.user.id } });
    res.redirect('/dashboard');
});

// GET - Download da anotação
router.get('/:id/download', isLoggedIn, async (req, res) => {
    const note = await Note.findOne({ where: { id: req.params.id, UserId: req.user.id } });
    if (!note) return res.status(404).send('Não encontrado.');
    
    const filename = `${note.title.replace(/ /g, '_')}.txt`;
    const fileContents = `Título: ${note.title}\n\n${note.content}`;
    
    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-type', 'text/plain; charset=utf-8');
    res.send(fileContents);
});

// POST - Deletar múltiplas anotações
router.post('/batch-delete', isLoggedIn, async (req, res) => {
    const { noteIds } = req.body;
    if (noteIds) {
        const ids = Array.isArray(noteIds) ? noteIds : [noteIds];
        await Note.update(
            { status: 'deleted' },
            { where: { id: { [Op.in]: ids }, UserId: req.user.id } }
        );
    }
    res.redirect('/dashboard');
});


module.exports = router;