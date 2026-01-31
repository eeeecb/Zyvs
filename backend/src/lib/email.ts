import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Usar domínio de teste do Resend até verificar domínio próprio
// https://resend.com/docs/dashboard/domains/introduction
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Thumdra <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<SendEmailResult> {
  const resetUrl = `${FRONTEND_URL}/redefinir-senha?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - Thumdra</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #0a0a0a; border-radius: 12px; border: 1px solid #1a1a1a;">
          <tr>
            <td style="padding: 40px 32px;">
              <!-- Logo -->
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #00ff88; letter-spacing: -0.5px;">THUMDRA</h1>
              </div>

              <!-- Title -->
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff; text-align: center;">
                Redefinir sua senha
              </h2>

              <!-- Text -->
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a0a0a0; text-align: center;">
                Recebemos uma solicitacao para redefinir a senha da sua conta. Clique no botao abaixo para criar uma nova senha.
              </p>

              <!-- Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #00ff88; color: #000000; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Redefinir Senha
                </a>
              </div>

              <!-- Expiration warning -->
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.5; color: #666666; text-align: center;">
                Este link expira em <strong style="color: #00ff88;">15 minutos</strong>.
              </p>

              <!-- Divider -->
              <div style="border-top: 1px solid #1a1a1a; margin: 24px 0;"></div>

              <!-- Alternative link -->
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #666666; text-align: center;">
                Se o botao nao funcionar, copie e cole este link no seu navegador:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 11px; color: #00ff88; word-break: break-all; text-align: center;">
                ${resetUrl}
              </p>

              <!-- Security notice -->
              <p style="margin: 0; font-size: 12px; color: #666666; text-align: center;">
                Se voce nao solicitou esta alteracao, ignore este email. Sua senha permanecera a mesma.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <p style="margin: 24px 0 0 0; font-size: 11px; color: #444444; text-align: center;">
          Thumdra - CRM &amp; Automacao
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // Development fallback: log to console if Resend is not configured
  if (!resend) {
    console.log('');
    console.log('========================================');
    console.log('PASSWORD RESET EMAIL (Dev Mode)');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('========================================');
    console.log('');
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Redefinir sua senha - Thumdra',
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Email send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
