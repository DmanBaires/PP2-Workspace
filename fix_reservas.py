#!/usr/bin/env python3
import re

# Read the file
with open('Frontend/JS/reservas.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the specific line
old_code = '''    if (!fecha || !canchaId) return;
    
    try {'''

new_code = '''    // Solo verificar si ambos campos tienen valores válidos
    if (!fecha || !canchaId || canchaId === '') {
        // Ocultar disponibilidad si no hay selección completa
        const disponibilidadContainer = document.getElementById('disponibilidadContainer');
        const seleccionHorario = document.getElementById('seleccionHorario');
        if (disponibilidadContainer) disponibilidadContainer.classList.add('d-none');
        if (seleccionHorario) seleccionHorario.classList.add('d-none');
        return;
    }
    
    try {'''

# Perform the replacement
new_content = content.replace(old_code, new_code)

# Write back
with open('Frontend/JS/reservas.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ File successfully fixed!")
