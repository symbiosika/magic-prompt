// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { parseDialogFromBlock } from './parse-dialog-from-block';

describe('parseDialogFromBlock', () => {
  it('should parse simple role blocks', async () => {
    const block = {
      type: 'block',
      content: `
        {{#role=system}}System message{{/role}}
        {{#role=user}}User message{{/role}}
        {{#role=assistant}}Assistant message{{/role}}
      `,
    };

    const messages = await parseDialogFromBlock(block);

    expect(messages).toHaveLength(3);
    expect(messages[0]).toEqual({
      role: 'system',
      content: 'System message',
    });
    expect(messages[1]).toEqual({
      role: 'user',
      content: 'User message',
    });
    expect(messages[2]).toEqual({
      role: 'assistant',
      content: 'Assistant message',
    });
  });

  it('should handle untagged content as user messages', () => {
    const block = {
      type: 'block',
      content:
        'Untagged content\n{{#role=assistant}}Assistant reply{{/role}}\nmore untagged content{{#role=user}}User reply{{/role}}',
    };

    const messages = parseDialogFromBlock(block);

    expect(messages).toHaveLength(4);
    expect(messages[0]).toEqual({
      role: 'user',
      content: 'Untagged content',
    });
    expect(messages[1]).toEqual({
      role: 'assistant',
      content: 'Assistant reply',
    });
    expect(messages[2]).toEqual({
      role: 'user',
      content: 'more untagged content',
    });
    expect(messages[3]).toEqual({
      role: 'user',
      content: 'User reply',
    });
  });

  it('should handle empty content', async () => {
    const block = {
      type: 'block',
      content: '',
    };

    const messages = parseDialogFromBlock(block);
    expect(messages).toHaveLength(0);
  });
});
