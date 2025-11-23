
// Routes/reservas.js - Rutas para gestión de reservas
const express = require('express');
const router = express.Router();
const db = require('../config');
const axios = require('axios'); // ✅ Importación necesaria

// Configuración Supabase
const SUPABASE_URL = 'https://urohgbxhaghxekactoug.supabase.co';

const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyb2hnYnhoYWdoeGVrYWN0b3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODEwMDgsImV4cCI6MjA3OTM1NzAwOH0.FgDepQafhCYUdmlzmRDkj9nLCLb2hOoNRScIFhZ-yZo'; // ✅ Reemplaza con tu API Key real


// GET /api/reservas - Obtener todas las reservas
router.get('/', async (req, res) => {
    try {
        const { fecha, cancha_id } = req.query;

        const filters = {};
        if (fecha) filters.fecha = fecha;
        if (cancha_id) filters.cancha_id = parseInt(cancha_id);

        const reservas = await db.getReservas(filters);

        res.json({
            success: true,
            data: reservas
        });
    } catch (error) {
        console.error('Error obteniendo reservas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las reservas',
            error: error.message
        });
    }
});

// ✅ GET /api/reservas/:id - Obtener una reserva por ID (corregido)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validar que el ID sea numérico
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'El ID debe ser un número válido'
            });
        }

        // Construir la URL completa para Supabase
        const url = `${SUPABASE_URL}/reservas?id=eq.${id}`;

        // Hacer la petición a Supabase
        const response = await axios.get(url, {
            headers: {
                apikey: SUPABASE_API_KEY,
                Authorization: `Bearer ${SUPABASE_API_KEY}`,
                Prefer: 'return=representation',
                'Content-Type': 'application/json'
            }
        });

        const reserva = response.data[0];

        if (!reserva) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        res.json({
            success: true,
            data: reserva
        });
    } catch (error) {
        console.error('Error obteniendo reserva:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la reserva',
            error: error.message
        });
    }
});

// POST /api/reservas - Crear nueva reserva
router.post('/', async (req, res) => {
    try {
        const {
            cancha_id,
            cliente_id,
            fecha,
            hora_inicio,
            hora_fin,
            precio_total,
            estado_id,
            seña_pagada,
            monto_seña,
            observaciones
        } = req.body;

        // Validaciones
        if (!cancha_id || !cliente_id || !fecha || !hora_inicio || !hora_fin) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos'
            });
        }

        // Verificar disponibilidad
        const disponible = await db.verificarDisponibilidad(
            parseInt(cancha_id),
            fecha,
            hora_inicio,
            hora_fin
        );

        if (!disponible) {
            return res.status(409).json({
                success: false,
                message: 'La cancha no está disponible en ese horario'
            });
        }

        // Crear reserva
        const nuevaReserva = await db.createReserva({
            cancha_id: parseInt(cancha_id),
            cliente_id: parseInt(cliente_id),
            fecha,
            hora_inicio,
            hora_fin,
            precio_total: parseFloat(precio_total),
            estado_id: parseInt(estado_id) || 1, // 1 = pendiente por defecto
            seña_pagada: seña_pagada || false,
            monto_seña: monto_seña ? parseFloat(monto_seña) : 0,
            observaciones: observaciones || '',
            created_at: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            message: 'Reserva creada exitosamente',
            data: nuevaReserva
        });
    } catch (error) {
        console.error('Error creando reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la reserva',
            error: error.message
        });
    }
});

// PUT /api/reservas/:id - Actualizar reserva
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Si se está cambiando horario o fecha, verificar disponibilidad
        if (updateData.fecha || updateData.hora_inicio || updateData.hora_fin) {
            const reservaActual = await db.client.get(`/reservas?id=eq.${id}`);
            const reserva = reservaActual.data[0];

            if (!reserva) {
                return res.status(404).json({
                    success: false,
                    message: 'Reserva no encontrada'
                });
            }

            const disponible = await db.verificarDisponibilidad(
                updateData.cancha_id || reserva.cancha_id,
                updateData.fecha || reserva.fecha,
                updateData.hora_inicio || reserva.hora_inicio,
                updateData.hora_fin || reserva.hora_fin,
                parseInt(id)
            );

            if (!disponible) {
                return res.status(409).json({
                    success: false,
                    message: 'La cancha no está disponible en ese horario'
                });
            }
        }

        const reservaActualizada = await db.updateReserva(parseInt(id), updateData);

        res.json({
            success: true,
            message: 'Reserva actualizada exitosamente',
            data: reservaActualizada
        });
    } catch (error) {
        console.error('Error actualizando reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la reserva',
            error: error.message
        });
    }
});

// DELETE /api/reservas/:id - Cancelar/eliminar reserva
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await db.deleteReserva(parseInt(id));

        res.json({
            success: true,
            message: 'Reserva eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la reserva',
            error: error.message
        });
    }
});

// PATCH /api/reservas/:id/estado - Cambiar estado de reserva
router.patch('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_id } = req.body;

        if (!estado_id) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere estado_id'
            });
        }

        const reservaActualizada = await db.updateReserva(parseInt(id), {
            estado_id: parseInt(estado_id)
        });

        res.json({
            success: true,
            message: 'Estado de reserva actualizado',
            data: reservaActualizada
        });
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado',
            error: error.message
        });
    }
});

module.exports = router;
