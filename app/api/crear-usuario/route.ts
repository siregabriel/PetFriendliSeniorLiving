// app/api/crear-usuario/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Recibimos los datos del formulario
    const { email, password, rol, adminId } = await request.json();

    // 2. Iniciamos Supabase con la LLAVE MAESTRA (Service Role)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 3. Verificamos que quien pide esto sea SUPER ADMIN (Seguridad extra)
    const { data: perfilAdmin } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', adminId)
      .single();

    if (perfilAdmin?.rol !== 'super_admin') {
      return NextResponse.json({ error: 'No tienes permisos.' }, { status: 403 });
    }

    // 4. CREAMOS EL USUARIO EN AUTH
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Lo confirmamos automáticamente
    });

    if (createError) throw createError;

    // 5. ACTUALIZAMOS SU ROL EN LA TABLA PERFILES
    // (El trigger handle_new_user ya lo creó como 'usuario', ahora lo subimos de nivel si hace falta)
    if (newUser.user && rol !== 'usuario') {
        const { error: updateError } = await supabaseAdmin
            .from('perfiles')
            .update({ rol: rol })
            .eq('id', newUser.user.id);
        
        if (updateError) throw updateError;
    }

    return NextResponse.json({ message: 'Usuario creado exitosamente' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}