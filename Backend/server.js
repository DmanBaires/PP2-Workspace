// server.js - Servidor Principal del Sistema de Reservas
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS MEJORADA - DEBE IR ANTES DE LAS RUTAS
app.use(cors({
    origin: function(origin, callback) {
        // Permitir requests sin origin (como Postman, aplicaciones móviles, etc)
        if (!origin) return callback(null, true);
        
        // Lista de orígenes permitidos
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5500',
            'http://localhost:5501',
            'http://127.0.0.1:5500',
            'http://127.0.0.1:5501',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001'
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('⚠️ Origen no permitido:', origin);
            callback(null, true); // Permitir de todos modos durante desarrollo
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../Frontend')));

// Importar rutas - Ajustado a tu estructura de carpetas
const authRoutes = require('./Routes/auth');
const reservasRoutes = require('./Routes/reservas');
const clientesRoutes = require('./Routes/clientes');
const canchasRoutes = require('./Routes/canchas');
const diasBloqueadosRoutes = require('./Routes/diasBloqueadosRoutes');

// Usar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/canchas', canchasRoutes);
app.use('/api/dias-bloqueados', diasBloqueadosRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        cors: 'habilitado'
    });
});

// Ruta raíz - servir la página principal
app.get('/', (req, res) => {
    res.json({
        message: 'Sistema de Reservas de Canchas de Fútbol',
        version: '1.0.0',
        endpoints: {
            reservas: '/api/reservas',
            clientes: '/api/clientes',
            canchas: '/api/canchas',
            diasBloqueados: '/api/dias-bloqueados',
            test: '/api/test'
        }
    });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Error de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Datos inválidos',
            errors: err.details
        });
    }
    
    // Error de base de datos
    if (err.code && err.code.includes('ER_')) {
        return res.status(409).json({
            success: false,
            message: 'Error en la base de datos',
            details: err.message
        });
    }
    
    // Error genérico del servidor
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Página no encontrada'
        });
    }
});

// Inicializar servidor
app.listen(PORT, async () => {
    console.log('========================================');
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🔓 CORS: Habilitado para desarrollo`);
    console.log('========================================');
    
    // Inicializar base de datos
    try {
        const db = require('./config');
        await db.initialize();
        console.log('✅ Base de datos conectada exitosamente');
    } catch (err) {
        console.error('❌ Error conectando base de datos:', err.message);
        if (process.env.DB_TYPE === 'supabase') {
            console.log('💡 Verifica tus credenciales de Supabase en el archivo .env');
        } else {
            console.log('💡 Asegúrate de que XAMPP esté corriendo');
        }
    }
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor...');
    try {
        const db = require('./config');
        await db.close();
        console.log('✅ Conexiones cerradas correctamente');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error cerrando conexiones:', err);
        process.exit(1);
    }
});

module.exports = app;