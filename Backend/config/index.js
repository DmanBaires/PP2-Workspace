// ./config/index.js
require('dotenv').config();

// Determinar qué base de datos usar según la variable de entorno
const DB_TYPE = process.env.DB_TYPE || 'supabase';

let db;

if (DB_TYPE === 'supabase') {
    db = require('./supabase');
    console.log('📦 Usando Supabase como base de datos');
} else if (DB_TYPE === 'mariadb') {
    db = require('./mariadb');
    console.log('📦 Usando MariaDB como base de datos');
} else {
    throw new Error(`Tipo de base de datos no soportado: ${DB_TYPE}`);
}

module.exports = db;