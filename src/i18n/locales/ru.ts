/**
 * Russian (RU) locale.
 * Structure must match en.ts exactly.
 */
import type { LocaleShape } from './en';

const ru: LocaleShape = {
  app: {
    name: 'Vybe',
  },
  home: {
    title: 'Добро пожаловать в Vybe',
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
