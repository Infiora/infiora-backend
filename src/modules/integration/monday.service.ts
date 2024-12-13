/* eslint-disable import/prefer-default-export */
import axios from 'axios';
import { logger } from '../logger';

type Column = {
  id: string;
  title: string;
  type: string;
};

const API_URL = 'https://api.monday.com/v2';

/**
 * Maps lead data fields to Monday.com board columns.
 * @param data - Lead data.
 * @param columns - Board columns.
 * @returns Mapped column values.
 */
function mapDataToColumns(data: any, columns: Column[]): Record<string, any> {
  const allowedFields = ['name', 'email', 'phone', 'company'];
  const mappedData: Record<string, any> = {};

  columns.forEach((column) => {
    const matchingField = Object.keys(data).find((key) => key.toLowerCase().includes(column.title.toLowerCase()));

    if (matchingField && allowedFields.includes(matchingField.toLowerCase())) {
      const value = data[matchingField] || '';
      if (value) {
        mappedData[column.id] = column.type === 'text' ? value : { [column.type]: value, text: value };
      }
    }
  });

  return mappedData;
}

/**
 * Executes a GraphQL query against the Monday.com API.
 * @param accessToken - The Monday.com API access token.
 * @param query - The GraphQL query string.
 * @param variables - Variables for the query.
 * @returns The data returned by the API.
 */
async function executeMondayQuery(accessToken: string, query: string, variables: Record<string, any>): Promise<any> {
  try {
    const response = await axios.post(API_URL, JSON.stringify({ query, variables }), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data;
  } catch (error: any) {
    const apiError = error.response?.data?.errors || error.message;
    logger.error(`Monday.com API error: ${apiError}`);
    throw new Error(`Monday.com API Error: ${apiError}`);
  }
}

/**
 * Fetches boards and its columns from Monday.com.
 * @param accessToken - The Monday.com API access token.
 * @returns The board details including its columns.
 */
export async function fetchBoards(accessToken: string): Promise<any> {
  const query = `
    query {
      boards {
        id
        name
      }
    }
  `;
  const data = await executeMondayQuery(accessToken, query, {});

  return data.boards;
}

/**
 * Fetches a board and its columns from Monday.com.
 * @param accessToken - The Monday.com API access token.
 * @param boardId - The ID of the board to fetch.
 * @returns The board details including its columns.
 */
async function fetchBoard(accessToken: string, boardId: string): Promise<any> {
  const query = `
    query GetBoard($boardId: [ID!]) {
      boards(ids: $boardId) {
        id
        name
        columns {
          id
          title
          type
        }
      }
    }
  `;
  const data = await executeMondayQuery(accessToken, query, { boardId });
  return data.boards?.[0];
}

/**
 * Creates an item on a Monday.com board.
 * @param accessToken - The Monday.com API access token.
 * @param boardId - The ID of the board where the item will be created.
 * @param itemName - The name of the item.
 * @param columnValues - The column values for the item.
 */
async function createItemOnBoard(
  accessToken: string,
  boardId: string,
  itemName: string,
  columnValues: Record<string, any>
): Promise<void> {
  const query = `
    mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
      }
    }
  `;
  await executeMondayQuery(accessToken, query, {
    boardId,
    itemName,
    columnValues: JSON.stringify(columnValues),
  });
}

/**
 * Synchronizes a lead with Monday.com.
 * @param lead - The lead data.
 * @param accessToken - The Monday.com API access token.
 * @param action - The action containing board information.
 */
export async function syncLead(lead: any, accessToken?: string, action?: any): Promise<void> {
  if (!accessToken || !action?.boardId) {
    logger.error('Missing access token or boardId for Monday.com integration');
    return;
  }

  try {
    const board = await fetchBoard(accessToken, action.boardId);
    if (!board) throw new Error('Board not found');

    const itemName = lead.Name || 'Unnamed Lead';
    const mappedColumns = mapDataToColumns(lead, board.columns);

    await createItemOnBoard(accessToken, board.id, itemName, mappedColumns);
    logger.info(`Lead uploaded to Monday.com: ${itemName}`);
  } catch (error: any) {
    logger.error(`Error uploading lead to Monday.com: ${error.message}`);
  }
}
