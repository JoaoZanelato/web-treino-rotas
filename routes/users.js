const express = require('express');
const router = express.Router();
const { User, Note } = require('../models');
const { Op } = require('sequelize');

// Middleware para garantir que o usuário está logado antes de acessar as rotas
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// --- ROTAS DE PERFIL ---

// GET - Exibe a página de perfil do usuário
router.get('/profile', isLoggedIn, (req, res, next) => {
    try {
        res.render('pages/profile', { title: 'Meu Perfil' });
    } catch (error) {
        next(error);
    }
});

// POST - Atualiza as informações do perfil do usuário
router.post('/profile', isLoggedIn, async (req, res, next) => {
    try {
        const { name, pronoun } = req.body;
        
        // Validações básicas
        if (!name || name.trim().length === 0) {
            return res.render('pages/profile', { 
                title: 'Meu Perfil', 
                error: 'O nome é obrigatório.' 
            });
        }

        if (name.trim().length > 100) {
            return res.render('pages/profile', { 
                title: 'Meu Perfil', 
                error: 'O nome deve ter no máximo 100 caracteres.' 
            });
        }

        await User.update(
            { 
                name: name.trim(), 
                pronoun: pronoun ? pronoun.trim() : null 
            },
            { where: { id: req.user.id } }
        );
        
        // Atualiza os dados do usuário na sessão
        req.user.name = name.trim();
        req.user.pronoun = pronoun ? pronoun.trim() : null;
        
        res.render('pages/profile', { 
            title: 'Meu Perfil', 
            success: 'Perfil atualizado com sucesso!' 
        });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.render('pages/profile', { 
            title: 'Meu Perfil', 
            error: 'Ocorreu um erro ao atualizar o perfil.' 
        });
    }
});

// POST - Deleta permanentemente o perfil do usuário e todas as suas anotações
router.post('/profile/delete', isLoggedIn, async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // A opção 'onDelete: CASCADE' na associação do modelo User->Note
        // garante que todas as anotações do usuário serão apagadas junto com ele.
        await User.destroy({ where: { id: userId } });
        
        // Encerra a sessão do usuário
        req.logout(err => {
            if (err) {
                console.error('Erro ao fazer logout após deletar perfil:', err);
                return next(err);
            }
            res.redirect('/');
        });
    } catch (error) {
        console.error('Erro ao deletar perfil:', error);
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
        
        res.render('pages/trash', { 
            title: 'Lixeira', 
            notes: trashedNotes 
        });
    } catch (error) {
        console.error('Erro ao carregar lixeira:', error);
        next(error);
    }
});

// POST - Restaura uma anotação da lixeira, mudando seu status para 'active'
router.post('/trash/:id/restore', isLoggedIn, async (req, res, next) => {
    try {
        const noteId = req.params.id;
        
        // Verifica se a nota existe e pertence ao usuário
        const note = await Note.findOne({
            where: {
                id: noteId,
                UserId: req.user.id,
                status: 'deleted'
            }
        });

        if (!note) {
            return res.status(404).render('pages/error', {
                title: 'Erro 404',
                error: { status: 404 },
                message: 'Anotação não encontrada na lixeira.'
            });
        }

        await Note.update(
            { status: 'active' },
            { 
                where: { 
                    id: noteId, 
                    UserId: req.user.id 
                } 
            }
        );
        
        res.redirect('/users/trash'); // Redireciona de volta para a lixeira
    } catch (error) {
        console.error('Erro ao restaurar anotação:', error);
        next(error);
    }
});

// POST - Exclui permanentemente uma anotação da lixeira
router.post('/trash/:id/delete', isLoggedIn, async (req, res, next) => {
    try {
        const noteId = req.params.id;
        
        // Verifica se a nota existe e pertence ao usuário
        const note = await Note.findOne({
            where: {
                id: noteId,
                UserId: req.user.id,
                status: 'deleted'
            }
        });

        if (!note) {
            return res.status(404).render('pages/error', {
                title: 'Erro 404',
                error: { status: 404 },
                message: 'Anotação não encontrada na lixeira.'
            });
        }

        await Note.destroy({
            where: {
                id: noteId,
                UserId: req.user.id
            }
        });
        
        res.redirect('/users/trash'); // Redireciona de volta para a lixeira
    } catch (error) {
        console.error('Erro ao excluir permanentemente:', error);
        next(error);
    }
});

// POST - Limpa toda a lixeira (exclui permanentemente todas as anotações deletadas)
router.post('/trash/clear', isLoggedIn, async (req, res, next) => {
    try {
        const deletedCount = await Note.destroy({
            where: {
                UserId: req.user.id,
                status: 'deleted'
            }
        });
        
        console.log(`${deletedCount} anotações excluídas permanentemente da lixeira`);
        res.redirect('/users/trash');
    } catch (error) {
        console.error('Erro ao limpar lixeira:', error);
        next(error);
    }
});

module.exports = router;