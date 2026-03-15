import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { validateRating } from '../../../lib/ratings';

export async function POST(request: Request) {
  try {
    // 1. Create Supabase client with anon key for session-based auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: request.headers.get('Authorization') ?? '',
          },
        },
      }
    );

    // 2. Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Parse request body
    const { comunidadId, stars, review } = await request.json() as {
      comunidadId: string;
      stars: number;
      review?: string;
    };

    // 4. Validate input
    const validationResult = validateRating({ stars, review });
    if (!validationResult.valid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    // 5. Upsert into valoraciones table
    const { data, error } = await supabase
      .from('valoraciones')
      .upsert(
        {
          comunidad_id: comunidadId,
          user_id: session.user.id,
          stars,
          review: review ?? null,
          status: 'pending',
        },
        { onConflict: 'comunidad_id,user_id' }
      )
      .select('id, status')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // 6. Return success
    return NextResponse.json({ id: data.id, status: 'pending' }, { status: 201 });

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
