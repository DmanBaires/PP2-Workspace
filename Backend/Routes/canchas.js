// Routes/canchas.js - Rutas para gestión de canchas
const express = require('express');
const router = express.Router();
const db = require('../config');

// GET /api/canchas - Obtener todas las canchas
router.get('/', async (req, res) => {
    try {
        const canchas = await db.getCanchas();
        
        res.json({
            success: true,
            data: canchas
        });
    } catch (error) {
        console.error('Error obteniendo canchas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las canchas',
            error: error.message
        });
    }
});

// GET /api/canchas/:id - Obtener una cancha por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cancha = await db.getCanchaById(parseInt(id));
        
        if (!cancha) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: cancha
        });
    } catch (error) {
        console.error('Error obteniendo cancha:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la cancha',
            error: error.message
        });
    }
});

// POST /api/canchas - Crear nueva cancha
router.post('/', async (req, res) => {
    try {
        const { nombre, capacidad, precio_por_hora, descripcion, estado } = req.body;
        
        // Validaciones
        if (!nombre || !capacidad || !precio_por_hora) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: nombre, capacidad, precio_por_hora'
            });
        }
        
        const nuevaCancha = await db.client.post('/canchas', {
            nombre,
            capacidad: parseInt(capacidad),
            precio_por_hora: parseFloat(precio_por_hora),
            descripcion: descripcion || '',
            estado: estado || 'disponible',
            created_at: new Date().toISOString()
        });
        
        res.status(201).json({
            success: true,
            message: 'Cancha creada exitosamente',
            data: nuevaCancha.data[0]
        });
    } catch (error) {
        console.error('Error creando cancha:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la cancha',
            error: error.message
        });
    }
});

// PUT /api/canchas/:id - Actualizar cancha
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, capacidad, precio_por_hora, descripcion, estado } = req.body;
        
        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (capacidad !== undefined) updateData.capacidad = parseInt(capacidad);
        if (precio_por_hora !== undefined) updateData.precio_por_hora = parseFloat(precio_por_hora);
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (estado !== undefined) updateData.estado = estado;
        
        const response = await db.client.patch(`/canchas?id=eq.${id}`, updateData);
        
        if (response.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Cancha actualizada exitosamente',
            data: response.data[0]
        });
    } catch (error) {
        console.error('Error actualizando cancha:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la cancha',
            error: error.message
        });
    }
});

// DELETE /api/canchas/:id - Eliminar cancha
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.client.delete(`/canchas?id=eq.${id}`);
        
        res.json({
            success: true,
            message: 'Cancha eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando cancha:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la cancha',
            error: error.message
        });
    }
});

// GET /api/canchas/:id/disponibilidad - Verificar disponibilidad
router.get('/:id/disponibilidad', async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, hora_inicio, hora_fin } = req.query;
        
        if (!fecha || !hora_inicio || !hora_fin) {
            return res.status(400).json({
                success: false,
                message: 'Faltan parámetros: fecha, hora_inicio, hora_fin'
            });
        }
        
        const disponible = await db.verificarDisponibilidad(
            parseInt(id),
            fecha,
            hora_inicio,
            hora_fin
        );
        
        res.json({
            success: true,
            disponible
        });
    } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar disponibilidad',
            error: error.message
        });
    }
});

module.exports = router;