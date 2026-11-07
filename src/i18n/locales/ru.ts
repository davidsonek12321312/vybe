/**
 * Russian (RU) locale.
 * Structure must match en.ts exactly.
 */
import type { LocaleShape } from './en';

const ru: LocaleShape = {
  app: {
    name: 'MOVA',
  },
  home: {
    title: 'Добро пожаловать в MOVA',
    tagline: 'Узнайте, что происходит в Дананге',
    comingSoon: 'События в Дананге скоро появятся.',
  },
  notFound: {
    title: 'Страница не найдена',
    body: 'Такой страницы не существует.',
    goHome: 'На главную',
  },
};

export default ru;
