/**
 * Stand-in photographs for the fictional sample events (design lab). They are
 * bundled files, never remote URLs, so the cover-host rule in mapping.ts is
 * unchanged: real events still show only covers from the project's Storage.
 * All are Wikimedia Commons files under CC BY or CC BY-SA; credits are
 * shown on the event page and listed in design-lab/PHOTO_CREDITS.md.
 */
export interface SampleCover {
  /** A bundled asset (Metro asset id). */
  source: number;
  credit: string;
}

const COVERS: Record<string, SampleCover> = {
  'coworking-coffee-meetup': {
    source: require('../../../assets/images/sample/coworking.jpg'),
    credit: 'ePi.Longo · CC BY-SA 2.0',
  },
  'sunset-social-my-khe': {
    source: require('../../../assets/images/sample/sunset-social.jpg'),
    credit: 'Cerevisae · CC BY-SA 4.0',
  },
  'morning-beach-volleyball': {
    source: require('../../../assets/images/sample/volleyball.jpg'),
    credit: 'Alon · CC BY 2.0',
  },
  'beach-social-001': {
    source: require('../../../assets/images/sample/beach-social.jpg'),
    credit: 'Kuroczynski · CC BY-SA 4.0',
  },
  'street-food-walk-an-thuong': {
    source: require('../../../assets/images/sample/street-food.jpg'),
    credit: 'Cohaithaofoody · CC BY-SA 4.0',
  },
  'rooftop-night': {
    source: require('../../../assets/images/sample/rooftop.jpg'),
    credit: 'Ninara · CC BY 2.0',
  },
  'sketching-dragon-bridge': {
    source: require('../../../assets/images/sample/dragon-bridge.jpg'),
    credit: 'Kuroczynski · CC BY-SA 4.0',
  },
  'vietnamese-english-exchange': {
    source: require('../../../assets/images/sample/language-exchange.jpg'),
    credit: 'Clarin · CC BY 2.5',
  },
  'intro-to-pottery': {
    source: require('../../../assets/images/sample/pottery.jpg'),
    credit: 'José Goncalves · CC BY 3.0',
  },
};

/** The bundled stand-in for a sample event, or null for real events. */
export function sampleCoverFor(event: { slug: string; isSample: boolean }): SampleCover | null {
  return event.isSample ? (COVERS[event.slug] ?? null) : null;
}
