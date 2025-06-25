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

// Middleware para verificar se a nota pertence ao usuário
async function checkNoteOwnership(req, res, next) {
    try {
        const note = await Note.findOne({ 
            where: { 
                id: req.params.id, 
                UserId: req.user.id 
            } 
        });
        
        if (!note) {
            return res.status(404).render('pages/error', {
                title: 'Erro 404',
                error: { status: 404 },
                message: 'Anotação não encontrada ou você não tem permissão para acessá-la.'
            });
        }
        
        req.note = note; // Adiciona a nota ao objeto req para uso posterior
        next();
    } catch (error) {
        next(error);
    }
}

// GET - Exibe o formulário para criar uma nova anotação
router.get('/create', isLoggedIn, (req, res, next) => {
    try {
        // Passamos 'note: null' para que o mesmo formulário possa ser usado para edição
        res.render('pages/note_form', { title: 'Nova Anotação', note: null });
    } catch (error) {
        next(error);
    }
});

// POST - Salva a nova anotação no banco de dados
router.post('/create', isLoggedIn, async (req, res, next) => {
    try {
        const { title, content } = req.body;
        
        // Validações básicas
        if (!title || !content) {
            return res.render('pages/note_form', {
                title: 'Nova Anotação',
                note: { title, content },
                error: 'Título e conteúdo são obrigatórios.'
            });
        }

        if (title.length > 255) {
            return res.render('pages/note_form', {
                title: 'Nova Anotação',
                note: { title, content },
                error: 'O título deve ter no máximo 255 caracteres.'
            });
        }

        await Note.create({
            title: title.trim(),
            content: content.trim(),
            UserId: req.user.id // Associa a anotação ao usuário logado
        });
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Erro ao criar anotação:', error);
        next(error);
    }
});

// GET - Download da anotação como um arquivo .txt
router.get('/:id/download', isLoggedIn, checkNoteOwnership, async (req, res, next) => {
    try {
        const note = req.note;
        const filename = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        const fileContents = `Título: ${note.title}\n\nConteúdo:\n${note.content}`;

        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'text/plain; charset=utf-8');
        res.send(fileContents);
    } catch (error) {
        console.error('Erro ao fazer download:', error);
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
            
            // Verifica se todos os IDs são números válidos
            const validIds = ids.filter(id => !isNaN(parseInt(id)));
            
            if (validIds.length > 0) {
                // Atualiza o status de todas as anotações selecionadas para 'deleted'
                const updatedCount = await Note.update(
                    { status: 'deleted' },
                    {
                        where: {
                            id: { [Op.in]: validIds }, // Usa o operador 'in' do Sequelize
                            UserId: req.user.id
                        }
                    }
                );
                
                console.log(`${updatedCount[0]} anotações movidas para a lixeira`);
            }
        }
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Erro na exclusão em lote:', error);
        next(error);
    }
});

// GET - Exibe os detalhes completos de uma anotação (deve vir antes das rotas com /:id/verbo)
router.get('/:id', isLoggedIn, checkNoteOwnership, async (req, res, next) => {
    try {
        const note = req.note;
        // Converte o conteúdo da anotação de Markdown para HTML
        const renderedContent = md.render(note.content || '');
        
        res.render('pages/note_detail', { 
            title: note.title, 
            note: note, 
            renderedContent: renderedContent 
        });
    } catch (error) {
        console.error('Erro ao exibir anotação:', error);
        next(error);
    }
});

// GET - Exibe o formulário de edição com os dados da anotação
router.get('/:id/edit', isLoggedIn, checkNoteOwnership, async (req, res, next) => {
    try {
        const note = req.note;
        res.render('pages/note_form', { title: 'Editar Anotação', note: note });
    } catch (error) {
        console.error('Erro ao carregar formulário de edição:', error);
        next(error);
    }
});

// POST - Salva as alterações de uma anotação existente
router.post('/:id/edit', isLoggedIn, checkNoteOwnership, async (req, res, next) => {
    try {
        const { title, content } = req.body;
        
        // Validações básicas
        if (!title || !content) {
            return res.render('pages/note_form', {
                title: 'Editar Anotação',
                note: { id: req.params.id, title, content },
                error: 'Título e conteúdo são obrigatórios.'
            });
        }

        if (title.length > 255) {
            return res.render('pages/note_form', {
                title: 'Editar Anotação',
                note: { id: req.params.id, title, content },
                error: 'O título deve ter no máximo 255 caracteres.'
            });
        }

        await Note.update(
            { 
                title: title.trim(), 
                content: content.trim() 
            },
            { 
                where: { 
                    id: req.params.id, 
                    UserId: req.user.id 
                } 
            }
        );
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Erro ao editar anotação:', error);
        next(error);
    }
});

// POST - Move uma anotação para a lixeira (soft delete)
router.post('/:id/delete', isLoggedIn, checkNoteOwnership, async (req, res, next) => {
    try {
        await Note.update(
            { status: 'deleted' },
            { 
                where: { 
                    id: req.params.id, 
                    UserId: req.user.id 
                } 
            }
        );
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Erro ao mover para lixeira:', error);
        next(error);
    }
});

module.exports = router;