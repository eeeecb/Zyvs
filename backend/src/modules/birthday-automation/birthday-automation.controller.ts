import { FastifyRequest, FastifyReply } from 'fastify';
import { BirthdayAutomationService } from './birthday-automation.service';
import { updateBirthdayAutomationSchema } from './birthday-automation.schema';

const birthdayService = new BirthdayAutomationService();

/**
 * GET /api/birthday-automation
 * Get birthday automation config
 */
export async function getConfig(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const config = await birthdayService.getConfig(organizationId);
    return reply.send(config);
  } catch (error: any) {
    console.error('Erro ao buscar config de aniversário:', error);
    return reply.status(500).send({
      error: 'Erro ao buscar configurações',
      message: error.message,
    });
  }
}

/**
 * PUT /api/birthday-automation
 * Update birthday automation config
 */
export async function updateConfig(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const data = updateBirthdayAutomationSchema.parse(req.body);
    const config = await birthdayService.updateConfig(organizationId, data);

    return reply.send(config);
  } catch (error: any) {
    console.error('Erro ao atualizar config de aniversário:', error);
    return reply.status(500).send({
      error: 'Erro ao atualizar configurações',
      message: error.message,
    });
  }
}

/**
 * GET /api/birthday-automation/upcoming
 * Get upcoming birthdays
 */
export async function getUpcomingBirthdays(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const organizationId = req.user.organizationId;
    const { days = 7 } = req.query as { days?: number };

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const result = await birthdayService.getUpcomingBirthdays(
      organizationId,
      Number(days)
    );
    return reply.send(result);
  } catch (error: any) {
    console.error('Erro ao buscar próximos aniversários:', error);
    return reply.status(500).send({
      error: 'Erro ao buscar aniversários',
      message: error.message,
    });
  }
}

/**
 * GET /api/birthday-automation/stats
 * Get birthday automation stats
 */
export async function getStats(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const stats = await birthdayService.getStats(organizationId);
    return reply.send(stats);
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return reply.status(500).send({
      error: 'Erro ao buscar estatísticas',
      message: error.message,
    });
  }
}
