#!/usr/bin/env python3
import re

# Read the file
with open('Backend/Routes/clientes.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the observaciones field from the destructuring and from the object
content = re.sub(
    r'(const \{[^}]*?)observaciones,?\s*',
    r'\1',
    content
)

# Remove the observaciones line from the createCliente call
content = re.sub(
    r'\s*observaciones: observaciones \|\| \'\',?\r?\n',
    '',
    content
)

# Write back
with open('Backend/Routes/clientes.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Removed observaciones field from clientes.js")
