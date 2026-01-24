import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    const data = await resend.emails.send({
      // IMPORTANTE: En modo prueba, 'from' DEBE ser onboarding@resend.dev
      from: 'Senior Pet Living <onboarding@resend.dev>', 
      to: [to], // En modo prueba, 'to' DEBE ser tu propio correo registrado
      subject: subject,
      html: html,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}