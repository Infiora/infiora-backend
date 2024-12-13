export const removeNullFields = (obj: any): any => {
  if (Array.isArray(obj)) {
    // If obj is an array, process its elements
    return obj
      .map((item) => (typeof item === 'object' && item !== null ? removeNullFields(item) : item))
      .filter((item) => item !== null && item !== undefined && item !== '');
  }
  if (typeof obj === 'object' && obj !== null) {
    // If obj is a plain object, process its keys
    const result: Record<string, any> = {};

    Object.entries(obj).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        // Recurse for nested objects or arrays
        const cleanedValue = removeNullFields(value);

        if (
          (Array.isArray(cleanedValue) && cleanedValue.length > 0) ||
          (typeof cleanedValue === 'object' && Object.keys(cleanedValue).length > 0) ||
          (!Array.isArray(cleanedValue) && typeof cleanedValue !== 'object')
        ) {
          result[key] = cleanedValue;
        }
      } else if (value !== null && value !== undefined && value !== '') {
        // Add non-null, non-empty values to the result
        result[key] = value;
      }
    });

    return result;
  }
  // If obj is neither an array nor an object, return it unchanged
  return obj;
};

export const generateUsername = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const generateString = (length: number): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialCharacters = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allCharacters = letters + numbers + specialCharacters;

  let result = '';

  // Ensure at least one letter
  result += letters[Math.floor(Math.random() * letters.length)];

  // Ensure at least one number
  result += numbers[Math.floor(Math.random() * numbers.length)];

  // Fill the remaining characters
  for (let i = result.length; i < length; i += 1) {
    const randomIndex = Math.floor(Math.random() * allCharacters.length);
    result += allCharacters[randomIndex];
  }

  // Shuffle the result to ensure randomness
  result = result
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');

  return result;
};

/**
 * Make valid url
 * @param {string} urlString
 * @returns {string}
 */
export const toUrl = (urlString: string) => {
  if (urlString.includes('http')) {
    return urlString;
  }
  return `https://${urlString}`;
};

/**
 * Converts a snake_case string to camelCase.
 * @param {string} str - The snake_case string to convert.
 * @return {string} The camelCase version of the string.
 */
export const toCamelCase = (str: any) => {
  return str.replace(/(_\w)/g, (match: any) => match[1].toUpperCase());
};

/**
 * Recursively converts all snake_case keys in an object to camelCase.
 * @param {Object} obj - The object to convert.
 * @return {Object} A new object with all keys in camelCase.
 */
export const convertSnakeToCamelCase = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj; // Return the value if it's not an object.
  }

  if (Array.isArray(obj)) {
    return obj.map((element) => convertSnakeToCamelCase(element));
  }

  return Object.entries(obj).reduce((acc: any, [key, value]) => {
    const camelKey = toCamelCase(key);
    acc[camelKey] = convertSnakeToCamelCase(value);
    return acc;
  }, {});
};

export const toDate = ({ startDate, endDate }: { startDate?: string; endDate?: string }) => {
  // Parse and validate the start date
  const start = startDate && !Number.isNaN(Date.parse(startDate)) ? new Date(startDate) : new Date(2023, 0, 1);

  // Parse and validate the end date
  const end = endDate && !Number.isNaN(Date.parse(endDate)) ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999); // Ensure end date is at the end of the day

  return { start, end };
};
