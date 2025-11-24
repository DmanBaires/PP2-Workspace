
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


// ✅ GET /api/reservas/disponibilidad - Obtener disponibilidad de canchas (DEBE IR ANTES DE /:id)
router.get('/disponibilidad', async (req, res) => {
    try {
        const { fecha, cancha_id } = req.query;

        if (!fecha) {
            return res.status(400).json({
                success: false,
                message: 'La fecha es requerida'
            });
        }

        // Verificar si el día está bloqueado
        const urlDiasBloqueados = `/dias_bloqueados?fecha=eq.${fecha}`;
        const diasBloqueadosResponse = await db.client.get(urlDiasBloqueados);

        if (diasBloqueadosResponse.data.length > 0) {
            const bloqueo = diasBloqueadosResponse.data[0];
            return res.json({
                success: true,
                bloqueado: true,
                mensaje: bloqueo.motivo || bloqueo.descripcion || 'Día no laborable',
                data: [],
                fecha: fecha
            });
        }

        // Obtener todas las canchas o una específica
        let urlCanchas = '/canchas?estado=eq.disponible';
        if (cancha_id) {
            urlCanchas += `&id=eq.${cancha_id}`;
        }

        const canchasResponse = await db.client.get(urlCanchas);
        const canchas = canchasResponse.data;

        // Para cada cancha, obtener sus reservas en la fecha indicada
        const disponibilidad = await Promise.all(canchas.map(async (cancha) => {
            const urlReservas = `/reservas?cancha_id=eq.${cancha.id}&fecha=eq.${fecha}&estado_id=in.(1,2)`;
            const reservasResponse = await db.client.get(urlReservas);

            return {
                id: cancha.id,
                nombre: cancha.nombre,
                precio_por_hora: cancha.precio_por_hora,
                reservas: reservasResponse.data.map(r => ({
                    hora_inicio: r.hora_inicio,
                    hora_fin: r.hora_fin
                }))
            };
        }));

        res.json({
            success: true,
            bloqueado: false,
            data: disponibilidad,
            fecha: fecha
        });
    } catch (error) {
        console.error('Error obteniendo disponibilidad:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error al obtener disponibilidad',
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


// ✅ POST /api/reservas - Crear nueva reserva con verificación en Supabase
router.post('/', async (req, res) => {
    try {
        const {
            cancha_id,
            cliente_id,
            fecha,
            hora_inicio,
            hora_fin,
            precio_total,
            observaciones
        } = req.body;

        // Validaciones básicas
        if (!cancha_id || !cliente_id || !fecha || !hora_inicio || !hora_fin) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos'
            });
        }

        // ✅ Paso 1: Verificar reservas existentes para la misma cancha y fecha
        const urlReservas = `/reservas?cancha_id=eq.${cancha_id}&fecha=eq.${fecha}`;
        const reservasExistentes = await db.client.get(urlReservas);

        const conflictoReserva = reservasExistentes.data.some(r =>
            (hora_inicio < r.hora_fin && hora_fin > r.hora_inicio)
        );
        if (conflictoReserva) {
            return res.status(409).json({
                success: false,
                message: 'La cancha no está disponible en ese horario (conflicto con otra reserva)'
            });
        }

        // ✅ Paso 2: Verificar bloqueos horarios
        const urlBloqueos = `/bloqueos_horarios?cancha_id=eq.${cancha_id}&fecha_inicio=lte.${fecha}&fecha_fin=gte.${fecha}`;
        const bloqueos = await db.client.get(urlBloqueos);

        const conflictoBloqueo = bloqueos.data.some(b =>
            (hora_inicio < b.hora_fin && hora_fin > b.hora_inicio)
        );
        if (conflictoBloqueo) {
            return res.status(409).json({
                success: false,
                message: 'Horario bloqueado para esta cancha'
            });
        }

        // ✅ Paso 3: Verificar días bloqueados
        const urlDiasBloqueados = `/dias_bloqueados?fecha=eq.${fecha}`;
        const diasBloqueados = await db.client.get(urlDiasBloqueados);

        if (diasBloqueados.data.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Este día está bloqueado para reservas'
            });
        }

        // ✅ Si todo está OK, crear la reserva en Supabase
        const nuevaReserva = {
            cancha_id: parseInt(cancha_id),
            cliente_id: parseInt(cliente_id),
            fecha,
            hora_inicio,
            hora_fin,
            precio_total: parseFloat(precio_total),
            estado_id: 1, // Estado pendiente por defecto
            observaciones: observaciones || ''
        };

        const response = await db.client.post('/reservas', nuevaReserva);

        res.status(201).json({
            success: true,
            message: 'Reserva creada exitosamente',
            data: response.data[0]
        });

    } catch (error) {
        console.error('Error creando reserva:', error.message);
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
