/* eslint-disable import/prefer-default-export */
import { logger } from '../logger';
import { IIntegration } from './integration.interfaces';
import * as mondayService from './monday.service';

export const syncLead = async (integrations: IIntegration[], leads: any, isAuto: boolean = true): Promise<void> => {
  try {
    const syncPromises = integrations.map(async (integration) => {
      const action = isAuto ? integration.data.actions?.autoSyncLeads : integration.data.actions?.syncLeads;
      const integrationKey = integration.key;

      if (action?.isActive) {
        const { accessToken } = integration.data;

        // Iterate over leads for each integration
        const leadSyncPromises = leads.map(async (lead: any) => {
          if (integrationKey === 'monday') {
            await mondayService.syncLead(lead, accessToken, action);
          }
        });

        // Wait for all lead syncs for this integration
        await Promise.all(leadSyncPromises);
      }
    });

    // Wait for all integration syncs to finish concurrently
    await Promise.all(syncPromises);
  } catch (error: any) {
    logger.error(`Error syncing leads: ${error.message}`);
  }
};
