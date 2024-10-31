/**
 * Try to parse in this order: boolean, number, string
 */
const parseBoolOrNumberOrString = (
  expression: string | undefined
): string | number | boolean | undefined => {
  if (expression === 'true' || expression === 'false') {
    return expression === 'true';
  }
  if (!isNaN(Number(expression))) {
    return Number(expression);
  }
  return expression;
};
/**
 * A default argument parser
 * Will parse all arguments in the form of:
 * argument=value OR argument="value" OR argument='value'
 * All values in quotes or single quotes will be parsed as strings.
 * All other values will be parsed as boolean, number or string.
 *
 * selector is {{#<selector> argument1=value1 argument2=value2 ... }}
 */
export const parseArgumentsWithoutLimits = (
  rawContent: string,
  selector: string
): Record<string, string | number | boolean | undefined> => {
  const regex = new RegExp(`{{#${selector}\\s*([^}]*)}}`);
  const matches = rawContent.match(regex);
  if (!matches || !matches[1]) {
    return {};
  }
  const argumentsString = matches[1].trim();
  if (!argumentsString) {
    return {};
  }

  const args = (argumentsString.match(/(\w+)=("[^"]*"|'[^']*'|\S+)/g) ||
    []) as string[];
  return args.reduce<Record<string, string | number | boolean | undefined>>(
    (acc, argument: string) => {
      const [key, value] = argument.split('=');
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      acc[key] = parseBoolOrNumberOrString(cleanValue);
      return acc;
    },
    {}
  );
};
