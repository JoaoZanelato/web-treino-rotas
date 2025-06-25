const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Configuração da estratégia local do Passport
passport.use(new LocalStrategy({ 
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        console.log('Tentativa de login para:', email);
        
        // Busca o usuário pelo email
        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
        
        if (!user) {
            console.log('Usuário não encontrado:', email);
            return done(null, false, { message: 'Email não cadastrado.' });
        }

        // Verifica se a senha está correta
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            console.log('Senha incorreta para:', email);
            return done(null, false, { message: 'Senha incorreta.' });
        }

        console.log('Login bem-sucedido para:', email);
        return done(null, user);
        
    } catch (err) {
        console.error('Erro na autenticação:', err);
        return done(err);
    }
}));

// Serialização do usuário (salva o ID na sessão)
passport.serializeUser((user, done) => {
    console.log('Serializando usuário:', user.id);
    done(null, user.id);
});

// Deserialização do usuário (recupera o usuário completo pelo ID)
passport.deserializeUser(async (id, done) => {
    try {
        console.log('Deserializando usuário:', id);
        const user = await User.findByPk(id);
        
        if (!user) {
            console.log('Usuário não encontrado na deserialização:', id);
            return done(null, false);
        }
        
        console.log('Usuário deserializado com sucesso:', user.email);
        done(null, user);
    } catch (err) {
        console.error('Erro na deserialização:', err);
        done(err);
    }
});