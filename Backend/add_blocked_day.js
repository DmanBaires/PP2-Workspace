require('dotenv').config();
const db = require('./config');

async function addBlockedDay() {
    try {
        const fecha = '2025-11-25'; // Tomorrow
        console.log(`Adding blocked day: ${fecha}`);

        // Check if already blocked
        const check = await db.client.get(`/dias_bloqueados?fecha=eq.${fecha}`);
        if (check.data.length > 0) {
            console.log('Day is already blocked. Updating reason...');
            await db.client.patch(`/dias_bloqueados?fecha=eq.${fecha}`, {
                motivo: 'Mantenimiento General',
                descripcion: 'Cierre por reparaciones en las canchas'
            });
        } else {
            await db.client.post('/dias_bloqueados', {
                fecha: fecha,
                motivo: 'Mantenimiento General',
                descripcion: 'Cierre por reparaciones en las canchas'
            });
        }

        console.log('✅ Blocked day added successfully for 2025-11-25');
    } catch (error) {
        console.error('❌ Error adding blocked day:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

addBlockedDay();
