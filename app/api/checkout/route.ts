// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    });
    const { comunidadId, nombre } = await request.json();

    // Creamos la sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Publicación: ${nombre}`,
              description: 'Publicación de propiedad en Directorio Pet Friendly',
            },
            unit_amount: 499, // 499 centavos = $4.99 USD
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/publicar/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/publicar`,
      metadata: {
        comunidadId: String(comunidadId), // Forzamos a que sea texto
        //comunidadId: comunidadId, // IMPORTANTÍSIMO: Aquí guardamos el ID para saber qué casa se pagó
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}