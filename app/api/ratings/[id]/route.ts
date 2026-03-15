import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Anon client with forwarded Authorization header to get session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: { Authorization: request.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Service role client for privileged operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check caller's role
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', session.user.id)
      .single();

    const allowedRoles = ['moderator', 'admin', 'super_admin'];
    if (!perfil || !allowedRoles.includes(perfil.rol)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action } = await request.json() as { action: 'approve' | 'reject' };

    // Verify rating exists
    const { data: rating, error: fetchError } = await supabaseAdmin
      .from('valoraciones')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !rating) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('valoraciones')
      .update({ status: newStatus })
      .eq('id', id)
      .select('id, status')
      .single();

    if (updateError || !updated) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ id: updated.id, status: updated.status });

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
