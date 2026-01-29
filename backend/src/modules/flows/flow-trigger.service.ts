import { prisma } from '../../lib/prisma';
import { startFlowExecution } from '../../jobs/queues/flow-execution.queue';

interface FlowNode {
  id: string;
  type: string;
  data: {
    label: string;
    config: any;
  };
  position: { x: number; y: number };
}

type TriggerType = 'new_contact' | 'tag_added' | 'tag_removed' | 'date_field';

/**
 * Service to handle flow triggers
 * This service checks for active flows that match certain events
 * and starts their execution
 */
export class FlowTriggerService {
  /**
   * Trigger flows when a new contact is created
   */
  async onNewContact(contactId: string, organizationId: string): Promise<void> {
    await this.triggerFlows(organizationId, contactId, 'new_contact');
  }

  /**
   * Trigger flows when a tag is added to a contact
   */
  async onTagAdded(
    contactId: string,
    organizationId: string,
    tagId: string
  ): Promise<void> {
    await this.triggerFlows(organizationId, contactId, 'tag_added', { tagId });
  }

  /**
   * Trigger flows when a tag is removed from a contact
   */
  async onTagRemoved(
    contactId: string,
    organizationId: string,
    tagId: string
  ): Promise<void> {
    await this.triggerFlows(organizationId, contactId, 'tag_removed', { tagId });
  }

  /**
   * Trigger flows based on date fields (called by cron)
   */
  async onDateFieldMatch(
    contactId: string,
    organizationId: string,
    dateField: string
  ): Promise<void> {
    await this.triggerFlows(organizationId, contactId, 'date_field', { dateField });
  }

  /**
   * Internal method to find and trigger matching flows
   */
  private async triggerFlows(
    organizationId: string,
    contactId: string,
    triggerType: TriggerType,
    triggerData: Record<string, any> = {}
  ): Promise<void> {
    // Find all active flows for this organization
    const flows = await prisma.flow.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        nodes: true,
      },
    });

    // Find flows with matching triggers
    for (const flow of flows) {
      const nodes = flow.nodes as unknown as FlowNode[];
      const triggerNode = nodes.find((n) => n.type === 'trigger');

      if (!triggerNode) continue;

      const config = triggerNode.data.config;

      // Check if trigger matches
      let shouldTrigger = false;

      switch (triggerType) {
        case 'new_contact':
          shouldTrigger = config.triggerType === 'new_contact';
          break;

        case 'tag_added':
          shouldTrigger =
            config.triggerType === 'tag_added' &&
            config.tagId === triggerData.tagId;
          break;

        case 'tag_removed':
          shouldTrigger =
            config.triggerType === 'tag_removed' &&
            config.tagId === triggerData.tagId;
          break;

        case 'date_field':
          shouldTrigger =
            config.triggerType === 'date_field' &&
            config.dateField === triggerData.dateField;
          break;
      }

      if (shouldTrigger) {
        // Check if there's already a running execution for this contact and flow
        const existingExecution = await prisma.flowExecution.findFirst({
          where: {
            flowId: flow.id,
            contactId,
            status: { in: ['RUNNING', 'PAUSED'] },
          },
        });

        if (existingExecution) {
          console.log(
            `Flow ${flow.name} already running for contact ${contactId}, skipping`
          );
          continue;
        }

        // Create execution record
        const execution = await prisma.flowExecution.create({
          data: {
            flowId: flow.id,
            contactId,
            status: 'RUNNING',
            currentNodeId: triggerNode.id,
            executionLog: [],
          },
        });

        // Queue the flow execution
        await startFlowExecution(
          flow.id,
          execution.id,
          contactId,
          organizationId,
          triggerNode.id,
          { triggerType, ...triggerData }
        );

        console.log(
          `Started flow "${flow.name}" execution ${execution.id} for contact ${contactId}`
        );
      }
    }
  }
}

// Singleton instance
export const flowTriggerService = new FlowTriggerService();
