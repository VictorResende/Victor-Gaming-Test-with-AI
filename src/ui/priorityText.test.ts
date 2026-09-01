import { describe, expect, it } from 'vitest';
import { TargetPriority } from '../core/Constants';
import { setLanguage } from '../i18n/locales';
import { describeTargetPriority, describeTargetPriorityShort } from './priorityText';

describe('priorityText', () => {
  it('localizes full and short aim labels', () => {
    setLanguage('pt');
    expect(describeTargetPriority(TargetPriority.FASTEST)).toBe('Mais Rápido');
    expect(describeTargetPriorityShort(TargetPriority.FIRST)).toBe('1º');
    setLanguage('en');
    expect(describeTargetPriorityShort(TargetPriority.FIRST)).toBe('1st');
    setLanguage('pt');
  });
});
