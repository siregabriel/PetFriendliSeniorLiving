import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Si el evento es "Pago Completado"
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Recuperamos el ID de la comunidad que guardamos en los metadatos
    const comunidadId = session.metadata?.comunidadId;

    if (comunidadId) {
      // Iniciamos Supabase con permisos de admin
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );

      // Actualizamos la base de datos
      await supabaseAdmin
        .from('comunidades')
        .update({ 
          pagado: true,     // Confirma el pago
          destacada: true   // Activa automáticamente el banner dorado ✨
        })
        .eq('id', comunidadId);
        
      console.log(`✅ Comunidad ${comunidadId} marcada como pagada.`);
    }
  }

  return NextResponse.json({ received: true });
}