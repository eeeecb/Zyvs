import { contactSchema } from '../contacts.schema';
import { ImportRow, ParsedContact } from './import.types';

export class ImportValidator {
  /**
   * Validar e transformar uma linha importada
   */
  validate(row: ImportRow): ParsedContact {
    // Processar tags (separadas por vírgula)
    let tags: string[] | undefined;
    if (row.tags && typeof row.tags === 'string') {
      tags = row.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    }

    // Montar objeto de contato
    const contactData = {
      name: row.name || row.nome,
      email: row.email,
      phone: row.phone || row.telefone,
      company: row.company || row.empresa,
      position: row.position || row.cargo,
      city: row.city || row.cidade,
      state: row.state || row.estado,
      notes: row.notes || row.observacoes || row.obs,
    };

    // Validar com Zod
    const validated = contactSchema.parse(contactData);

    return {
      ...validated,
      tags,
    };
  }

  /**
   * Normalizar telefone (remover caracteres especiais)
   */
  normalizePhone(phone?: string): string | undefined {
    if (!phone) return undefined;
    return phone.replace(/\D/g, ''); // Remove tudo que não é dígito
  }

  /**
   * Validar email
   */
  isValidEmail(email?: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
