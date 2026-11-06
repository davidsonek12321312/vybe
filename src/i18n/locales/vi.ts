/**
 * Vietnamese (VI) locale.
 * Structure must match en.ts exactly.
 */
import type { LocaleShape } from './en';

const vi: LocaleShape = {
  app: {
    name: 'Vybe',
  },
  home: {
    title: 'Chào mừng đến với Vybe',
    tagline: 'Khám phá những gì đang xảy ra ở Đà Nẵng',
    comingSoon: 'Sự kiện tại Đà Nẵng sắp ra mắt.',
  },
  notFound: {
    title: 'Không tìm thấy trang',
    body: 'Trang này không tồn tại.',
    goHome: 'Về trang chủ',
  },
};

export default vi;
