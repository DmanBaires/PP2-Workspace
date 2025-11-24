require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function createAdmin() {
    const email = 'admin@futbolreservas.com';
    const password = 'Admin123!';

    console.log(`Creating admin user in Supabase Auth: ${email}`);

    // Check if user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError.message);
        return;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log('User already exists in Supabase Auth. Updating password...');
        const { data, error } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: password, user_metadata: { rol: 'admin' } }
        );

        if (error) {
            console.error('Error updating admin:', error.message);
        } else {
            console.log('✅ Admin password updated successfully.');
        }
    } else {
        ({ data, error } = await supabase.auth.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                nombre: 'Administrador',
                apellido: 'Sistema',
                rol: 'admin'
            }
        }));

        if (error) {
            console.error('Error creating admin:', error.message);
        } else {
            console.log('✅ Admin user created successfully:', data.user.id);
        }
    }

    // ----- NEW SECTION: Ensure admin exists in local `usuarios` table -----
    const db = require('../config'); // unified DB config (Supabase or MariaDB)
    const supabaseUserId = existingUser ? existingUser.id : (data && data.user && data.user.id);
    if (!supabaseUserId) {
        console.error('Could not determine Supabase user ID for admin upsert.');
        return;
    }
    try {
        // Upsert admin record: if exists, update role; otherwise insert
        await db.run(`
            INSERT INTO usuarios (email, password, nombre, apellido, rol, supabase_user_id)
            VALUES (?, 'supabase_auth', ?, ?, ?, ?)
            ON CONFLICT (email) DO UPDATE SET
                rol = EXCLUDED.rol,
                supabase_user_id = EXCLUDED.supabase_user_id;
        `, [email, 'Administrador', 'Sistema', 'admin', supabaseUserId]);
        console.log('✅ Admin record upserted in local usuarios table.');
    } catch (e) {
        console.error('Error upserting admin in usuarios table:', e.message);
    }
    // ---------------------------------------------------------------
}

createAdmin();
