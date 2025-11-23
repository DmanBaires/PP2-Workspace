// Routes/auth.js - Rutas de autenticación
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Importar controlador de autenticación
const {
    registro,
    login,
    getPerfil,
    actualizarPerfil,
    verificarToken
} = require('../Controllers/authControllerCustom');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array()
        });
    }
    next();
};

// POST /api/auth/registro - Registrar nuevo cliente
router.post('/registro', [
    body('nombre')
        .notEmpty().withMessage('El nombre es obligatorio')
        .trim()
        .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('telefono')
        .notEmpty().withMessage('El teléfono es obligatorio')
        .trim()
        .matches(/^[0-9]{10,15}$/).withMessage('Teléfono inválido (10-15 dígitos)'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Email inválido'),
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], handleValidationErrors, registro);

// POST /api/auth/login - Iniciar sesión
router.post('/login', [
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Email inválido'),
    body('telefono')
        .optional()
        .trim(),
    body('password')
        .optional()
], handleValidationErrors, login);

// GET /api/auth/perfil - Obtener perfil del usuario autenticado
router.get('/perfil', verificarToken, getPerfil);

// PUT /api/auth/perfil - Actualizar perfil del usuario autenticado
router.put('/perfil', [
    verificarToken,
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Email inválido'),
    body('telefono')
        .optional()
        .trim()
        .matches(/^[0-9]{10,15}$/).withMessage('Teléfono inválido'),
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], handleValidationErrors, actualizarPerfil);

// POST /api/auth/verificar - Verificar si el token es válido
router.post('/verificar', verificarToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token válido',
        data: {
            id: req.user.id,
            email: req.user.email,
            tipo: req.user.tipo
        }
    });
});

module.exports = router;