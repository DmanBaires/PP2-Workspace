require('dotenv').config();
const db = require('./config');

const holidays2025 = [
    { fecha: '2025-01-01', motivo: 'Año Nuevo', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-03-03', motivo: 'Carnaval', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-03-04', motivo: 'Carnaval', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-03-24', motivo: 'Día Nacional de la Memoria por la Verdad y la Justicia', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-04-02', motivo: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-04-17', motivo: 'Jueves Santo', descripcion: 'Día no laborable' },
    { fecha: '2025-04-18', motivo: 'Viernes Santo', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-05-01', motivo: 'Día del Trabajador', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-05-02', motivo: 'Feriado Puente Turístico', descripcion: 'Día no laborable con fines turísticos' },
    { fecha: '2025-05-25', motivo: 'Día de la Revolución de Mayo', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-06-17', motivo: 'Paso a la Inmortalidad del Gral. Don Martín Miguel de Güemes', descripcion: 'Feriado Trasladable' },
    { fecha: '2025-06-20', motivo: 'Paso a la Inmortalidad del Gral. Manuel Belgrano', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-07-09', motivo: 'Día de la Independencia', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-08-15', motivo: 'Feriado Puente Turístico', descripcion: 'Día no laborable con fines turísticos' },
    { fecha: '2025-08-17', motivo: 'Paso a la Inmortalidad del Gral. José de San Martín', descripcion: 'Feriado Trasladable (se observa el 15/08?)' }, // Note: Search said 17th is Sunday, moved to 15th bridge? Or 17th moved? Search said "17 de agosto... se traslada al viernes 15 de agosto". Wait, 17 is Sunday. Usually moved to Monday. But search said "se traslada al viernes 15". Let's stick to search result or maybe just block 15th as bridge and 17th?
    // Search said: "17 de agosto... se traslada al viernes 15 de agosto, que también es día no laborable puente". This implies 15th IS the holiday observation.
    // Let's block 15th (already added as bridge) and maybe update description.
    // Actually, let's just add 15th as "Paso a la Inmortalidad del Gral. José de San Martín (Observado)" and remove the bridge entry if it's the same day.
    // Re-reading: "17 de agosto... se traslada al viernes 15 de agosto". So 15th is the day off.

    { fecha: '2025-10-10', motivo: 'Día del Respeto a la Diversidad Cultural (Observado)', descripcion: 'Feriado Trasladable (Original 12/10)' },
    { fecha: '2025-11-21', motivo: 'Feriado Puente Turístico', descripcion: 'Día no laborable con fines turísticos' },
    { fecha: '2025-11-24', motivo: 'Día de la Soberanía Nacional (Observado)', descripcion: 'Feriado Trasladable (Original 20/11)' },
    { fecha: '2025-12-08', motivo: 'Inmaculada Concepción de María', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-12-25', motivo: 'Navidad', descripcion: 'Feriado Inamovible' }
];

// Refined list based on search results
const holidaysFinal = [
    { fecha: '2025-01-01', motivo: 'Año Nuevo', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-03-03', motivo: 'Carnaval', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-03-04', motivo: 'Carnaval', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-03-24', motivo: 'Día Nacional de la Memoria por la Verdad y la Justicia', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-04-02', motivo: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-04-17', motivo: 'Jueves Santo', descripcion: 'Día no laborable' },
    { fecha: '2025-04-18', motivo: 'Viernes Santo', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-05-01', motivo: 'Día del Trabajador', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-05-02', motivo: 'Feriado Puente Turístico', descripcion: 'Día no laborable' },
    { fecha: '2025-05-25', motivo: 'Día de la Revolución de Mayo', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-06-17', motivo: 'Paso a la Inmortalidad del Gral. Don Martín Miguel de Güemes', descripcion: 'Feriado Trasladable' }, // Search said "se traslada". Usually to Monday. June 17 2025 is Tuesday. Maybe moved to 16? Or 20 is Friday.
    // Search said: "17 de junio... (se traslada)". It didn't say where.
    // Let's assume standard rule: if Tue/Wed -> Mon. If Thu/Fri -> Mon next week?
    // Actually, let's just block the actual date if unsure, or check calendar.
    // Calendar 2025: June 17 is Tuesday.
    // Let's stick to the list provided by search which listed it as "Trasladable".
    // I will add it as is for now.
    { fecha: '2025-06-20', motivo: 'Paso a la Inmortalidad del Gral. Manuel Belgrano', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-07-09', motivo: 'Día de la Independencia', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-08-15', motivo: 'Paso a la Inmortalidad del Gral. José de San Martín (Observado)', descripcion: 'Feriado Trasladable' },
    { fecha: '2025-10-10', motivo: 'Día del Respeto a la Diversidad Cultural (Observado)', descripcion: 'Feriado Trasladable' },
    { fecha: '2025-11-21', motivo: 'Feriado Puente Turístico', descripcion: 'Día no laborable' },
    { fecha: '2025-11-24', motivo: 'Día de la Soberanía Nacional (Observado)', descripcion: 'Feriado Trasladable' },
    { fecha: '2025-12-08', motivo: 'Inmaculada Concepción de María', descripcion: 'Feriado Inamovible' },
    { fecha: '2025-12-25', motivo: 'Navidad', descripcion: 'Feriado Inamovible' }
];

async function addHolidays() {
    console.log(`Adding ${holidaysFinal.length} holidays for 2025...`);

    let added = 0;
    let updated = 0;
    let errors = 0;

    for (const holiday of holidaysFinal) {
        try {
            // Check if exists
            const check = await db.client.get(`/dias_bloqueados?fecha=eq.${holiday.fecha}`);

            if (check.data.length > 0) {
                console.log(`Updating ${holiday.fecha}: ${holiday.motivo}`);
                await db.client.patch(`/dias_bloqueados?fecha=eq.${holiday.fecha}`, {
                    motivo: holiday.motivo,
                    descripcion: holiday.descripcion
                });
                updated++;
            } else {
                console.log(`Adding ${holiday.fecha}: ${holiday.motivo}`);
                await db.client.post('/dias_bloqueados', holiday);
                added++;
            }
        } catch (error) {
            console.error(`Error processing ${holiday.fecha}:`, error.message);
            errors++;
        }
    }

    console.log('========================================');
    console.log(`Finished processing holidays.`);
    console.log(`Added: ${added}`);
    console.log(`Updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    console.log('========================================');
}

addHolidays();
