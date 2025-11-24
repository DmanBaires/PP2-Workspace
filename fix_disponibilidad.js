// Quick fix for reservas.js - modify the verificarDisponibilidad function
const fs = require('fs');

const filePath = './Frontend/JS/reservas.js';
const content = fs.readFileSync(filePath, 'utf8');

// Replace the old function with the fixed version
const oldFunction = `// Verificar disponibilidad de la cancha
async function verificarDisponibilidad() {
    const fecha = document.getElementById('fecha').value;
    const canchaId = document.getElementById('cancha').value;
    
    if (!fecha || !canchaId) return;
    
    try {
        const response = await ReservasAPI.verificarDisponibilidad(fecha, canchaId);
        
        if (response.success) {
            disponibilidadActual = response.data;
            mostrarDisponibilidad(disponibilidadActual);
        }
    } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        UIUtils.mostrarError('Error al verificar disponibilidad');
    }
}`;

const newFunction = `// Verificar disponibilidad de la cancha
async function verificarDisponibilidad() {
    const fecha = document.getElementById('fecha').value;
    const canchaId = document.getElementById('cancha').value;
    
    // Solo verificar si ambos campos tienen valores válidos
    if (!fecha || !canchaId || canchaId === '') {
        // Ocultar disponibilidad si no hay selección completa
        const disponibilidadContainer = document.getElementById('disponibilidadContainer');
        const seleccionHorario = document.getElementById('seleccionHorario');
        if (disponibilidadContainer) disponibilidadContainer.classList.add('d-none');
        if (seleccionHorario) seleccionHorario.classList.add('d-none');
        return;
    }
    
    try {
        const response = await ReservasAPI.verificarDisponibilidad(fecha, canchaId);
        
        if (response.success) {
            disponibilidadActual = response.data;
            mostrarDisponibilidad(disponibilidadActual);
        }
    } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        UIUtils.mostrarError('Error al verificar disponibilidad');
    }
}`;

const newContent = content.replace(oldFunction, newFunction);

if (content === newContent) {
    console.log('ERROR: No changes made - pattern not found!');
    process.exit(1);
}

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ File successfully updated!');
