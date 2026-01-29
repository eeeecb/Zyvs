import { prisma } from '../../lib/prisma';
import { MessageChannel } from '@prisma/client';
import type { UpdateBirthdayAutomationInput } from './birthday-automation.schema';

export class BirthdayAutomationService {
  /**
   * Get birthday automation config for organization
   * Creates default config if none exists
   */
  async getConfig(organizationId: string) {
    let config = await prisma.birthdayAutomation.findUnique({
      where: { organizationId },
    });

    // Create default config if not exists
    if (!config) {
      config = await prisma.birthdayAutomation.create({
        data: {
          organizationId,
          isEnabled: false,
          template:
            'Feliz Aniversário, {{nome}}!\n\nNeste dia especial, preparamos um presente para você: 15% de desconto em qualquer compra!\n\nUse o cupom: ANIVER15\n\nVálido por 7 dias. Aproveite!',
          channel: 'WHATSAPP',
          sendAtHour: 9,
        },
      });
    }

    return config;
  }

  /**
   * Update birthday automation config
   */
  async updateConfig(
    organizationId: string,
    data: UpdateBirthdayAutomationInput
  ) {
    // Ensure config exists first
    await this.getConfig(organizationId);

    const config = await prisma.birthdayAutomation.update({
      where: { organizationId },
      data: {
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
        ...(data.template && { template: data.template }),
        ...(data.channel && { channel: data.channel as MessageChannel }),
        ...(data.sendAtHour !== undefined && { sendAtHour: data.sendAtHour }),
      },
    });

    return config;
  }

  /**
   * Get upcoming birthdays for the next N days
   */
  async getUpcomingBirthdays(organizationId: string, days: number = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get contacts with birthdate in the organization
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId,
        birthdate: { not: null },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthdate: true,
      },
      orderBy: { birthdate: 'asc' },
    });

    // Filter and calculate days until birthday
    const upcomingBirthdays = contacts
      .map((contact) => {
        if (!contact.birthdate) return null;

        const birthdate = new Date(contact.birthdate);
        const thisYearBirthday = new Date(
          today.getFullYear(),
          birthdate.getMonth(),
          birthdate.getDate()
        );

        // If birthday already passed this year, check next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const diffTime = thisYearBirthday.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysUntil > days) return null;

        return {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          birthdate: contact.birthdate.toISOString(),
          daysUntil,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return { contacts: upcomingBirthdays };
  }

  /**
   * Get birthday automation stats
   */
  async getStats(organizationId: string) {
    const config = await this.getConfig(organizationId);

    // Count contacts with birthdate
    const contactsWithBirthdate = await prisma.contact.count({
      where: {
        organizationId,
        birthdate: { not: null },
        status: 'ACTIVE',
      },
    });

    // Get upcoming birthdays count (next 30 days)
    const upcoming = await this.getUpcomingBirthdays(organizationId, 30);

    return {
      totalSent: config.totalSent,
      lastSentAt: config.lastSentAt,
      contactsWithBirthdate,
      upcomingNext30Days: upcoming.contacts.length,
    };
  }
}
