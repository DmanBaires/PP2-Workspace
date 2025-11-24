// ./config/supabase.js - Conexión a Supabase usando REST API
const axios = require('axios');

class SupabaseDatabase {
    constructor() {
        this.baseUrl = process.env.SUPABASE_URL;
        // Usar SERVICE_ROLE_KEY para el backend (tiene permisos totales)
        this.apiKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!this.baseUrl || !this.apiKey) {
            throw new Error('Faltan SUPABASE_URL y SUPABASE_ANON_KEY en .env');
        }

        // Cliente HTTP con configuración
        this.client = axios.create({
            baseURL: `${this.baseUrl}/rest/v1`,
            headers: {
                'apikey': this.apiKey,
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            timeout: 10000
        });
    }

    async initialize() {
        try {
            console.log('🔗 Conectando a Supabase via REST API...');
            console.log(`🌐 URL: ${this.baseUrl}`);

            // Probar la conexión
            const response = await this.client.get('/canchas?limit=1');

            console.log('✅ Conectado a Supabase (REST API) exitosamente');

            // Verificar tablas
            await this.verifyTables();

        } catch (error) {
            console.error('❌ Error conectando a Supabase:', error.message);
            if (error.response) {
                console.error('Código de respuesta:', error.response.status);
                console.error('Mensaje:', error.response.data);
            }
            throw error;
        }
    }

    async verifyTables() {
        try {
            const tables = [
                'canchas', 'tipos_cliente', 'clientes', 'estados_reserva',
                'reservas', 'pagos', 'configuraciones', 'bloqueos_horarios',
                'usuarios', 'dias_bloqueados'
            ];

            const results = await Promise.allSettled(
                tables.map(table => this.client.get(`/${table}?limit=1`))
            );

            const missingTables = tables.filter((table, index) =>
                results[index].status === 'rejected'
            );

            if (missingTables.length > 0) {
                console.warn('⚠️  Tablas faltantes o inaccesibles:', missingTables.join(', '));
            } else {
                console.log('✅ Todas las tablas están accesibles');
            }
        } catch (error) {
            console.warn('⚠️  No se pudo verificar todas las tablas');
        }
    }

    // Ejecutar consulta SELECT
    async query(sql, params = []) {
        // Para queries básicas, usar la API REST
        // Nota: SQL directo no está disponible via REST, necesitas usar los endpoints de tabla
        throw new Error('Usa métodos específicos de tabla en lugar de SQL directo');
    }

    // Métodos helpers para cada tabla
    async getCanchas() {
        const response = await this.client.get('/canchas?order=id.asc');
        return response.data;
    }

    async getCanchaById(id) {
        const response = await this.client.get(`/canchas?id=eq.${id}`);
        return response.data[0] || null;
    }

    async getReservas(filters = {}) {
        let url = '/reservas?order=fecha.desc,hora_inicio.desc';

        if (filters.fecha) {
            url += `&fecha=eq.${filters.fecha}`;
        }
        if (filters.cancha_id) {
            url += `&cancha_id=eq.${filters.cancha_id}`;
        }

        const response = await this.client.get(url);
        return response.data;
    }

    async createReserva(data) {
        const response = await this.client.post('/reservas', data);
        return response.data[0];
    }

    async updateReserva(id, data) {
        const response = await this.client.patch(`/reservas?id=eq.${id}`, data);
        return response.data[0];
    }

    async deleteReserva(id) {
        await this.client.delete(`/reservas?id=eq.${id}`);
        return { success: true };
    }

    async getClientes() {
        const response = await this.client.get('/clientes?order=nombre.asc');
        return response.data;
    }

    async getClienteById(id) {
        const response = await this.client.get(`/clientes?id=eq.${id}`);
        return response.data[0] || null;
    }

    async getClienteByEmail(email) {
        const response = await this.client.get(`/clientes?email=eq.${email}`);
        return response.data[0] || null;
    }

    async getClienteByTelefono(telefono) {
        const response = await this.client.get(`/clientes?telefono=eq.${telefono}`);
        return response.data[0] || null;
    }

    async createCliente(data) {
        const response = await this.client.post('/clientes', data);
        return response.data[0];
    }

    async updateCliente(id, data) {
        const response = await this.client.patch(`/clientes?id=eq.${id}`, data);
        return response.data[0];
    }

    async getEstadosReserva() {
        const response = await this.client.get('/estados_reserva');
        return response.data;
    }

    async getDiasBloqueados() {
        const response = await this.client.get('/dias_bloqueados?order=fecha.asc');
        return response.data;
    }

    async createDiaBloqueado(data) {
        const response = await this.client.post('/dias_bloqueados', data);
        return response.data[0];
    }

    async deleteDiaBloqueado(id) {
        await this.client.delete(`/dias_bloqueados?id=eq.${id}`);
        return { success: true };
    }

    // Métodos para tabla usuarios
    async getUsuarioByEmail(email) {
        const response = await this.client.get(`/usuarios?email=eq.${email}`);
        return response.data[0] || null;
    }

    async getUsuarioById(id) {
        const response = await this.client.get(`/usuarios?id=eq.${id}`);
        return response.data[0] || null;
    }

    // Verificar disponibilidad de cancha
    async verificarDisponibilidad(cancha_id, fecha, hora_inicio, hora_fin, reserva_id = null) {
        try {
            let url = `/reservas?cancha_id=eq.${cancha_id}&fecha=eq.${fecha}`;

            // Filtrar por estados activos
            url += `&estado_id=in.(1,2)`; // Asumiendo 1=pendiente, 2=confirmada

            const response = await this.client.get(url);
            const reservas = response.data;

            // Filtrar conflictos en el cliente
            const conflictos = reservas.filter(r => {
                if (reserva_id && r.id === reserva_id) return false;

                // Verificar solapamiento de horarios
                return !(r.hora_fin <= hora_inicio || r.hora_inicio >= hora_fin);
            });

            return conflictos.length === 0;
        } catch (error) {
            console.error('Error verificando disponibilidad:', error);
            throw error;
        }
    }

    // Obtener configuración
    async getConfiguracion(clave) {
        try {
            const response = await this.client.get(`/configuraciones?clave=eq.${clave}`);
            const config = response.data[0];

            if (!config) return null;

            // Convertir según el tipo
            switch (config.tipo) {
                case 'number':
                    return parseFloat(config.valor);
                case 'boolean':
                    return config.valor === 'true';
                case 'json':
                    return JSON.parse(config.valor);
                default:
                    return config.valor;
            }
        } catch (error) {
            return null;
        }
    }

    // Actualizar configuración
    async setConfiguracion(clave, valor, tipo = 'string') {
        const valorString = typeof valor === 'object' ?
            JSON.stringify(valor) :
            valor.toString();

        try {
            // Intentar actualizar
            const response = await this.client.patch(
                `/configuraciones?clave=eq.${clave}`,
                { valor: valorString, tipo, updated_at: new Date().toISOString() }
            );

            if (response.data.length === 0) {
                // Si no existe, crear
                await this.client.post('/configuraciones', {
                    clave,
                    valor: valorString,
                    tipo,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error guardando configuración:', error);
            throw error;
        }
    }

    // Execute SQL query (returns array of rows)
    // Simplified implementation for basic queries
    async query(sql, params = []) {
        console.warn('Using simplified query() - complex SQL not fully supported');

        // Handle simple SELECT queries
        if (sql.includes('FROM dias_bloqueados')) {
            return await this.getDiasBloqueados();
        }

        if (sql.includes('FROM canchas')) {
            return await this.getCanchas();
        }

        throw new Error(`Unsupported SQL query: ${sql.substring(0, 50)}...`);
    }

    // Execute SQL query (returns single row or null)
    async queryOne(sql, params = []) {
        console.warn('Using simplified queryOne() - complex SQL not fully supported');

        // Handle SELECT queries
        if (sql.includes('FROM canchas') && sql.includes('WHERE id')) {
            return await this.getCanchaById(params[0]);
        }

        if (sql.includes('FROM dias_bloqueados') && sql.includes('WHERE id')) {
            const all = await this.getDiasBloqueados();
            return all.find(d => d.id === parseInt(params[0])) || null;
        }

        if (sql.includes('FROM dias_bloqueados') && sql.includes('WHERE fecha')) {
            const all = await this.getDiasBloqueados();
            const fecha = params[0];
            const cancha_id = params[1];

            return all.find(d => {
                const fechaMatch = d.fecha === fecha;
                const canchaMatch = cancha_id ?
                    (d.cancha_id === null || d.cancha_id === parseInt(cancha_id)) :
                    true;
                return fechaMatch && canchaMatch;
            }) || null;
        }

        // Handle INSERT INTO dias_bloqueados
        if (sql.includes('INSERT INTO dias_bloqueados')) {
            const [fecha, motivo, descripcion, cancha_id] = params;
            return await this.createDiaBloqueado({
                fecha,
                motivo,
                descripcion: descripcion || null,
                cancha_id: cancha_id || null
            });
        }

        // Handle DELETE
        if (sql.includes('DELETE FROM dias_bloqueados')) {
            const id = params[0];
            await this.deleteDiaBloqueado(id);
            return { id }; // Return deleted ID
        }

        // Handle UPDATE
        if (sql.includes('UPDATE dias_bloqueados')) {
            // This is complex, skip for now
            console.warn('UPDATE queries not fully supported in simplified mode');
            return null;
        }

        throw new Error(`Unsupported SQL query: ${sql.substring(0, 50)}...`);
    }

    async close() {
        console.log('✅ Cliente REST cerrado');
    }
}

// Singleton
const supabaseDbInstance = new SupabaseDatabase();

module.exports = supabaseDbInstance;