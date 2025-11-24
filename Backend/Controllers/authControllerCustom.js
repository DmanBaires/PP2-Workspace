// Controllers/authControllerCustom.js - Controlador de autenticación
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config');

// Secret para JWT (debería estar en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_cambiala';

/**
 * Registro de nuevo cliente
 */
const registro = async (req, res) => {
    try {
        const { nombre, apellido, email, telefono, password } = req.body;

        console.log('📝 Intentando registrar:', { nombre, apellido, email, telefono });

        // Validar campos requeridos
        if (!nombre || !telefono) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y teléfono son obligatorios'
            });
        }

        // Verificar si ya existe un cliente con ese email
        if (email) {
            const clienteExistente = await db.getClienteByEmail(email);
            if (clienteExistente) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un cliente registrado con ese email'
                });
            }
        }

        // Verificar si ya existe un cliente con ese teléfono
        const clientePorTelefono = await db.getClienteByTelefono(telefono);
        if (clientePorTelefono) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un cliente registrado con ese teléfono'
            });
        }

        // Crear el cliente (SIN password por ahora - la tabla no tiene esa columna)
        // Crear el cliente (SIN password por ahora - la tabla no tiene esa columna)
        const nuevoCliente = await db.createCliente({
            nombre: nombre,
            apellido: apellido || nombre, // Si no hay apellido, usar el nombre
            email: email || null,
            telefono,
            tipo_cliente_id: 1,
            created_at: new Date().toISOString()
        });

        console.log('✅ Cliente registrado:', nuevoCliente);

        // Generar token JWT
        const token = jwt.sign(
            {
                id: nuevoCliente.id,
                email: nuevoCliente.email,
                tipo: 'cliente'
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Registro exitoso',
            data: {
                cliente: {
                    id: nuevoCliente.id,
                    nombre: nuevoCliente.nombre,
                    email: nuevoCliente.email,
                    telefono: nuevoCliente.telefono
                },
                token
            }
        });

    } catch (error) {
        console.error('💥 Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar el cliente',
            error: error.message
        });
    }
};

/**
 * Login de cliente
 */
const login = async (req, res) => {
    try {
        const { email, telefono, password } = req.body;

        console.log('🔐 Intento de login:', { email, telefono });

        // Buscar primero en usuarios (para admins)
        let usuario = null;
        let esAdmin = false;

        if (email) {
            usuario = await db.getUsuarioByEmail(email);
            if (usuario) {
                esAdmin = true;
                console.log('✅ Usuario encontrado en tabla usuarios (rol:', usuario.rol, ')');
            }
        }

        // Si no se encontró en usuarios, buscar en clientes
        let cliente = null;
        if (!usuario) {
            if (email) {
                cliente = await db.getClienteByEmail(email);
            } else if (telefono) {
                cliente = await db.getClienteByTelefono(telefono);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Debes proporcionar email o teléfono'
                });
            }

            if (!cliente) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            console.log('✅ Cliente encontrado en tabla clientes');
        }

        // Verificar contraseña (DESHABILITADO - tabla sin columna password)
        // Por ahora, solo verifica que exista el usuario/cliente
        // TODO: Agregar columna password a la tabla clientes en Supabase

        // Generar token JWT
        const tokenData = esAdmin ? {
            id: usuario.id,
            email: usuario.email,
            tipo: 'admin',
            rol: usuario.rol
        } : {
            id: cliente.id,
            email: cliente.email,
            tipo: 'cliente'
        };

        const token = jwt.sign(
            tokenData,
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ Login exitoso:', esAdmin ? usuario.id : cliente.id);

        // Preparar datos de respuesta
        const responseData = esAdmin ? {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.rol,
            telefono: usuario.telefono || null
        } : {
            id: cliente.id,
            nombre: cliente.nombre,
            apellido: cliente.apellido,
            email: cliente.email,
            telefono: cliente.telefono,
            rol: 'cliente'
        };

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                ...responseData,
                token
            }
        });

    } catch (error) {
        console.error('💥 Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

/**
 * Obtener perfil del cliente autenticado
 */
const getPerfil = async (req, res) => {
    try {
        const clienteId = req.user.id; // Viene del middleware de autenticación

        const cliente = await db.getClienteById(clienteId);

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                id: cliente.id,
                nombre: cliente.nombre,
                email: cliente.email,
                telefono: cliente.telefono,
                tipo_cliente_id: cliente.tipo_cliente_id
            }
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el perfil',
            error: error.message
        });
    }
};

/**
 * Actualizar perfil del cliente
 */
const actualizarPerfil = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const { nombre, email, telefono, password } = req.body;

        const updateData = {};

        if (nombre) updateData.nombre = nombre;
        if (email) updateData.email = email;
        if (telefono) updateData.telefono = telefono;

        // Password deshabilitado - tabla sin esa columna
        // TODO: Agregar soporte para password cuando se agregue la columna

        const clienteActualizado = await db.updateCliente(clienteId, updateData);

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                id: clienteActualizado.id,
                nombre: clienteActualizado.nombre,
                email: clienteActualizado.email,
                telefono: clienteActualizado.telefono
            }
        });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el perfil',
            error: error.message
        });
    }
};

/**
 * Middleware para verificar JWT
 */
const verificarToken = (req, res, next) => {
    try {
        // Obtener token del header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

module.exports = {
    registro,
    login,
    getPerfil,
    actualizarPerfil,
    verificarToken
};