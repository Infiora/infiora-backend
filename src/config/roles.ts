const allRoles = {
  user: [],
  admin: [
    'getUsers',
    'manageUsers',
    'getProfiles',
    'getLeads',
    'getCategories',
    'manageCategories',
    'getPlatforms',
    'managePlatforms',
    'getBatches',
    'manageBatches',
    'getTags',
    'manageTags',
  ],
};

export const roles: string[] = Object.keys(allRoles);
export const roleRights: Map<string, string[]> = new Map(Object.entries(allRoles));
