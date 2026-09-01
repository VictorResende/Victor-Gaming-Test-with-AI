import { beforeEach, describe, expect, it } from 'vitest';
import { setLanguage, t } from '../i18n/locales';
import { weatherAnnounceKey, weatherIcon } from './weatherCopy';

describe('weather copy', () => {
  beforeEach(() => setLanguage('pt'));

  it('maps kinds to locale keys and icons', () => {
    expect(weatherAnnounceKey('CLEAR')).toBe('weatherClear');
    expect(weatherAnnounceKey('RAIN')).toBe('weatherRain');
    expect(weatherAnnounceKey('STORM')).toBe('weatherStorm');
    expect(weatherIcon('STORM')).toBe('⛈️');
  });

  it('localizes storm banner', () => {
    expect(t(weatherAnnounceKey('STORM'))).toContain('TEMPESTADE');
    setLanguage('en');
    expect(t(weatherAnnounceKey('STORM'))).toContain('THUNDERSTORM');
  });
});
