import { Message, RawBlock } from './types';

/**
 * Helper to generate an array of message blocks from a list of raw blocks.
 * This will split the raw blocks into message blocks by the {{#role=...}} keyword.
 * It will generate the messages for each block and return an array of message blocks.
 * All content without explicit role tags will be treated as "user" content.
 */
export const parseDialogFromBlock = (block: RawBlock): Message[] => {
  // Regular expressions to match role blocks and placeholders
  const roleBlockRegex = /{{#role=(\w+)}}([\s\S]*?){{\/role}}/g;
  const messages: Message[] = [];

  let lastIndex = 0;
  const content = block.content;

  // Find all role blocks
  const matches = Array.from(content.matchAll(roleBlockRegex));

  // Process content sequentially
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];

    // If there's content before this role block, treat it as user content
    if (match.index! > lastIndex) {
      const untaggedContent = content.slice(lastIndex, match.index).trim();
      if (untaggedContent) {
        messages.push({
          role: 'user',
          content: untaggedContent,
        });
      }
    }

    // Add the role block content
    const [_, role, messageContent] = match;
    messages.push({
      role: role as 'user' | 'assistant' | 'system',
      content: messageContent.trim(),
    });

    lastIndex = match.index! + match[0].length;
  }

  // Handle any remaining content after the last role block
  if (lastIndex < content.length) {
    const remainingContent = content.slice(lastIndex).trim();
    if (remainingContent) {
      messages.push({
        role: 'user',
        content: remainingContent,
      });
    }
  }

  return messages;
};
