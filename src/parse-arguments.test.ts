// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { parseArgumentsWithoutLimits } from './parse-arguments';

describe('parseArgumentsWithoutLimits', () => {
  it('should parse boolean values correctly', () => {
    const input = '{{#test arg1=true arg2=false}}';
    const result = parseArgumentsWithoutLimits(input, 'test');
    expect(result).toEqual({
      arg1: true,
      arg2: false,
    });
  });

  it('should parse number values correctly', () => {
    const input = '{{#test2 num1=42 num2=3.14}}';
    const result = parseArgumentsWithoutLimits(input, 'test2');
    expect(result).toEqual({
      num1: 42,
      num2: 3.14,
    });
  });

  it('should parse string values correctly', () => {
    const input = '{{#test_x str1="hello" str2=world}}';
    const result = parseArgumentsWithoutLimits(input, 'test_x');
    expect(result).toEqual({
      str1: 'hello',
      str2: 'world',
    });
  });

  it('should return empty object for non-matching selector', () => {
    const input = '{{#test arg=value}}';
    const result = parseArgumentsWithoutLimits(input, 'different');
    expect(result).toEqual({});
  });

  it('should handle mixed types correctly', () => {
    const input = '{{#test bool=true num=123 str="hello"}}';
    const result = parseArgumentsWithoutLimits(input, 'test');
    expect(result).toEqual({
      bool: true,
      num: 123,
      str: 'hello',
    });
  });

  it('should handle empty arguments string', () => {
    const input = '{{#test}}';
    const result = parseArgumentsWithoutLimits(input, 'test');
    expect(result).toEqual({});
  });
});
