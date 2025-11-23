// Routes/clientes.js - Rutas para gestión de clientes
const express = require('express');
const router = express.Router();
const db = require('../config');

// GET /api/clientes - Obtener todos los clientes
router.get('/', async (req, res) => {
    try {
        const clientes = await db.getClientes();
        
        res.json({
            success: true,
            data: clientes
        });
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los clientes',
            error: error.message
        });
    }
});

// GET /api/clientes/:id - Obtener un cliente por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await db.getClienteById(parseInt(id));
        
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: cliente
        });
    } catch (error) {
        console.error('Error obteniendo cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el cliente',
            error: error.message
        });
    }
});

// POST /api/clientes - Crear nuevo cliente
router.post('/', async (req, res) => {
    try {
        const {
            nombre,
            email,
            telefono,
            tipo_cliente_id,
            observaciones
        } = req.body;
        
        // Validaciones
        if (!nombre || !telefono) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: nombre, telefono'
            });
        }
        
        const nuevoCliente = await db.createCliente({
            nombre,
            email: email || null,
            telefono,
            tipo_cliente_id: parseInt(tipo_cliente_id) || 1,
            observaciones: observaciones || '',
            created_at: new Date().toISOString()
        });
        
        res.status(201).json({
            success: true,
            message: 'Cliente creado exitosamente',
            data: nuevoCliente
        });
    } catch (error) {
        console.error('Error creando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el cliente',
            error: error.message
        });
    }
});

// PUT /api/clientes/:id - Actualizar cliente
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Convertir tipos si es necesario
        if (updateData.tipo_cliente_id) {
            updateData.tipo_cliente_id = parseInt(updateData.tipo_cliente_id);
        }
        
        const clienteActualizado = await db.updateCliente(parseInt(id), updateData);
        
        if (!clienteActualizado) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Cliente actualizado exitosamente',
            data: clienteActualizado
        });
    } catch (error) {
        console.error('Error actualizando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el cliente',
            error: error.message
        });
    }
});

// DELETE /api/clientes/:id - Eliminar cliente
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.client.delete(`/clientes?id=eq.${id}`);
        
        res.json({
            success: true,
            message: 'Cliente eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el cliente',
            error: error.message
        });
    }
});

// GET /api/clientes/:id/reservas - Obtener reservas de un cliente
router.get('/:id/reservas', async (req, res) => {
    try {
        const { id } = req.params;
        
        const response = await db.client.get(
            `/reservas?cliente_id=eq.${id}&order=fecha.desc`
        );
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Error obteniendo reservas del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las reservas del cliente',
            error: error.message
        });
    }
});

module.exports = router;