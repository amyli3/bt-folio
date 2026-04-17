import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, message, website } = req.body ?? {};

    if (website) {
      return res.status(200).json({ ok: true });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (message.length > 4000) {
      return res.status(400).json({ error: 'Message too long' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const destination = process.env.CONTACT_EMAIL;

    if (!destination) {
      return res.status(500).json({ error: 'Contact email not configured' });
    }

    const safeName = String(name).replace(/[<>]/g, '').slice(0, 120);
    const safeEmail = String(email).slice(0, 200);
    const safeMessage = String(message).replace(/</g, '&lt;');

    await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: destination,
      replyTo: safeEmail,
      subject: `New portfolio message from ${safeName}`,
      html: `
        <p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${safeMessage}</p>
        <hr />
        <p style="color:#888;font-size:12px;">Sent from bt-folio.vercel.app</p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
