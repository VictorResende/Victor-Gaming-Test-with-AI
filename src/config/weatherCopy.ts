import type { I18nKey } from '../i18n/locales';

export type WeatherKind = 'CLEAR' | 'RAIN' | 'STORM';

export function weatherAnnounceKey(weather: WeatherKind): I18nKey {
  if (weather === 'CLEAR') return 'weatherClear';
  if (weather === 'RAIN') return 'weatherRain';
  return 'weatherStorm';
}

export function weatherIcon(weather: WeatherKind): string {
  if (weather === 'CLEAR') return '☀️';
  if (weather === 'RAIN') return '🌧️';
  return '⛈️';
}
