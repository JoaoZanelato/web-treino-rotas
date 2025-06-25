const express = require('express');
const router = express.Router();
const { Note } = require('../models');
const { Op } = require('sequelize'); // Importa o Operador 'in' para o batch-delete
const md = require('markdown-it')(); // Instância do conversor de Markdown

// Middleware para garantir que o usuário está logado antes de acessar as rotas
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// GET - Exibe o formulário para criar uma nova anotação
router.get('/create', isLoggedIn, (req, res) => {
    // Passamos 'note: null' para que o mesmo formulário possa ser usado para edição
    res.render('partials/note_form', { title: 'Nova Anotação', note: null });
});

// POST - Salva a nova anotação no banco de dados
router.post('/create', isLoggedIn, async (req, res, next) => {
    try {
        const { title, content } = req.body;
        await Note.create({
            title: title,
            content: content,
            UserId: req.user.id // Associa a anotação ao usuário logado
        });
        res.redirect('/dashboard');
    } catch (error) {
        next(error);
    }
});

// GET - Download da anotação como um arquivo .txt
router.get('/:id/download', isLoggedIn, async (req, res, next) => {
    try {
        const note = await Note.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (!note) {
            return res.status(404).send('Anotação não encontrada.');
        }

        const filename = `${note.title.replace(/ /g, '_')}.txt`;
        const fileContents = `Título: ${note.title}\n\n${note.content}`;

        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'text/plain; charset=utf-8');
        res.send(fileContents);
    } catch (error) {
        next(error);
    }
});


// POST - Deletar múltiplas anotações (exclusão em lote)
router.post('/batch-delete', isLoggedIn, async (req, res, next) => {
    try {
        const { noteIds } = req.body;
        if (noteIds) {
            // Garante que noteIds seja sempre um array, mesmo que apenas um item seja selecionado
            const ids = Array.isArray(noteIds) ? noteIds : [noteIds];
            // Atualiza o status de todas as anotações selecionadas para 'deleted'
            await Note.update(
                { status: 'deleted' },
                {
                    where: {
                        id: { [Op.in]: ids }, // Usa o operador 'in' do Sequelize
                        UserId: req.user.id
                    }
                }
            );
        }
        res.redirect('/dashboard');
    } catch (error) {
        next(error);
    }
});


// GET - Exibe os detalhes completos de uma anotação (deve vir antes das rotas com /:id/verbo)
router.get('/:id', isLoggedIn, async (req, res, next) => {
    try {
        const note = await Note.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (note) {
            // Converte o conteúdo da anotação de Markdown para HTML
            const renderedContent = md.render(note.content || '');
            res.render('partials/note_detail', { title: note.title, note: note, renderedContent: renderedContent });
        } else {
            return res.status(404).send('Anotação não encontrada');
        }
    } catch (error) {
        next(error);
    }
});

// GET - Exibe o formulário de edição com os dados da anotação
router.get('/:id/edit', isLoggedIn, async (req, res, next) => {
    try {
        const note = await Note.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (note) {
            res.render('partials/note_form', { title: 'Editar Anotação', note: note });
        } else {
            return res.status(404).send('Anotação não encontrada');
        }
    } catch (error) {
        next(error);
    }
});

// POST - Salva as alterações de uma anotação existente
router.post('/:id/edit', isLoggedIn, async (req, res, next) => {
    try {
        const { title, content } = req.body;
        await Note.update(
            { title, content },
            { where: { id: req.params.id, UserId: req.user.id } }
        );
        res.redirect('/dashboard');
    } catch (error) {
        next(error);
    }
});

// POST - Move uma anotação para a lixeira (soft delete)
router.post('/:id/delete', isLoggedIn, async (req, res, next) => {
    try {
        await Note.update(
            { status: 'deleted' },
            { where: { id: req.params.id, UserId: req.user.id } }
        );
        res.redirect('/dashboard');
    } catch (error) {
        next(error);
    }
});


module.exports = router;