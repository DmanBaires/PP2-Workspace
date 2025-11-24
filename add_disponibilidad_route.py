#!/usr/bin/env python3
import re

# Read the file
with open('Backend/Routes/reservas.js', 'r', encoding='utf-8') as f:
    content = f.read()

# The new disponibilidad route to insert
new_route = '''
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

        const headers = {
            apikey: SUPABASE_API_KEY,
            Authorization: `Bearer ${SUPABASE_API_KEY}`,
            'Content-Type': 'application/json'
        };

        // Obtener todas las canchas o una específica
        let urlCanchas = `${SUPABASE_URL}/canchas?estado=eq.disponible`;
        if (cancha_id) {
            urlCanchas += `&id=eq.${cancha_id}`;
        }

        const canchasResponse = await axios.get(urlCanchas, { headers });
        const canchas = canchasResponse.data;

        // Para cada cancha, obtener sus reservas en la fecha indicada
        const disponibilidad = await Promise.all(canchas.map(async (cancha) => {
            const urlReservas = `${SUPABASE_URL}/reservas?cancha_id=eq.${cancha.id}&fecha=eq.${fecha}&estado_id=in.(1,2)`;
            const reservasResponse = await axios.get(urlReservas, { headers });
            
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
            data: disponibilidad,
            fecha: fecha
        });
    } catch (error) {
        console.error('Error obteniendo disponibilidad:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener disponibilidad',
            error: error.message
        });
    }
});

'''

# Find the position to insert (before the /:id route)
pattern = r'(// ✅ GET /api/reservas/:id - Obtener una reserva por ID \(corregido\)\r?\nrouter\.get\(\'/:id\')'

# Insert the new route before the /:id route
new_content = re.sub(pattern, new_route + r'\1', content)

if content == new_content:
    print("❌ ERROR: Pattern not found - route not added")
    exit(1)

# Write back
with open('Backend/Routes/reservas.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Disponibilidad route added successfully!")
