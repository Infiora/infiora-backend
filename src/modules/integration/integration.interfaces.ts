export interface IIntegration {
  key: string;
  data: {
    accessToken?: string;
    actions?: {
      autoSyncLeads?: {
        isActive?: boolean;
      };
      syncLeads?: {
        isActive?: boolean;
      };
    };
  };
}
