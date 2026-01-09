import { FastifyRequest } from 'fastify';

/**
 * Middleware para preservar o raw body da requisição
 * Necessário para validação de assinatura do Stripe webhook
 */
export async function rawBodyMiddleware(request: FastifyRequest) {
  // Adicionar raw body à requisição para uso posterior
  const chunks: Buffer[] = [];

  request.raw.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  request.raw.on('end', () => {
    (request as any).rawBody = Buffer.concat(chunks);
  });
}
