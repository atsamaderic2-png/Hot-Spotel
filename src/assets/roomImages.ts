import realHero from './images/douala_real_hero.jpg';
import realOnomo from './images/douala_real_onomo.jpg';

import localCourtyard from './images/douala_local_courtyard.jpg';
import localLoungebar from './images/douala_local_loungebar.jpg';
import localPoolbar from './images/douala_local_poolbar.jpg';

import rawFanRoom from './images/douala_raw_fan_room.jpg';
import rawFanTv from './images/douala_raw_fan_tv.jpg';
import rawRedRoom from './images/douala_raw_red_room.jpg';
import rawRedWall from './images/douala_raw_red_wall.jpg';
import rawSuperair from './images/douala_raw_superair.jpg';
import rawKitchenette from './images/douala_raw_kitchenette.jpg';
import rawGreySuite from './images/douala_raw_grey_suite.jpg';
import rawBathEuro from './images/douala_raw_bath_euro.jpg';
import rawOrangeRoom from './images/douala_raw_orange_room.jpg';
import rawPartitionBath from './images/douala_raw_partition_bath.jpg';
import rawBlueYellow from './images/douala_raw_blueyellow.jpg';
import rawStudioSalon from './images/douala_raw_studio_salon.jpg';

import localAkwahin from './images/douala_local_akwahin.jpg';
import localClassic from './images/douala_local_classic.jpg';
import localGreenwall from './images/douala_local_greenwall.jpg';
import localRegina from './images/douala_local_regina.jpg';
import localTubsuite from './images/douala_local_tubsuite.jpg';
import localValance from './images/douala_local_valance.jpg';
import akwaDeluxe from './images/douala_akwa_deluxe.jpg';
import akwaOverview from './images/douala_akwa_overview.jpg';
import akwaSenior from './images/douala_akwa_senior.jpg';
import krystalClassic from './images/douala_krystal_classic.jpg';
import krystalDeluxeNew from './images/douala_krystal_deluxe_new.jpg';
import krystalExec from './images/douala_krystal_exec.jpg';
import krystalMandela from './images/douala_krystal_mandela.jpg';
import krystalMeugang from './images/douala_krystal_meugang.jpg';
import krystalPremium from './images/douala_krystal_premium.jpg';
import pullmanPool from './images/douala_pullman_room.jpg';
import ibisLobby from './images/douala_ibis_room.jpg';

export const HOTEL_HERO_IMAGE = realHero;

export interface GallerySlide {
  id: string;
  image: string;
  areaEn: string;
  areaFr: string;
  titleEn: string;
  titleFr: string;
  descEn: string;
  descFr: string;
}

export const HOTEL_GALLERY_SLIDES: GallerySlide[] = [
  {
    id: 'street-front',
    image: realHero,
    areaEn: 'Exterior · Akwa Boulevard Douala',
    areaFr: 'Extérieur · Boulevard d’Akwa Douala',
    titleEn: 'Central Akwa Hotel Building & Street Front',
    titleFr: 'Façade Hôtelière & Accès Rue à Akwa',
    descEn: 'Direct street access in central Douala with gated parking, reception desk, and nearby transit.',
    descFr: 'Accès direct sur rue au centre de Douala avec parking fermé, réception et transports à proximité.',
  },
  {
    id: 'bonanjo-wing',
    image: realOnomo,
    areaEn: 'Bonanjo Wing · Douala',
    areaFr: 'Aile Bonanjo · Douala',
    titleEn: 'Bonanjo Street Facade & Guest Arrival',
    titleFr: 'Façade Bonanjo & Arrivée Clients',
    descEn: 'Secure arrival entrance in the Bonanjo business district with 24-hour reception check-in.',
    descFr: 'Entrée sécurisée dans le quartier d’affaires de Bonanjo avec accueil 24h/24.',
  },
  {
    id: 'courtyard',
    image: localCourtyard,
    areaEn: 'Courtyard · Inner Wing Douala',
    areaFr: 'Cour Intérieure · Aile Centrale Douala',
    titleEn: 'Douala Hotel Courtyard & Poolside',
    titleFr: 'Cour Intérieure & Piscine à Douala',
    descEn: 'Inner courtyard terrace with seating, pool loungers, and quiet residence rooms.',
    descFr: 'Cour intérieure centrale avec terrasse, transats au bord de la piscine et chambres calmes.',
  },
  {
    id: 'lounge-bar',
    image: localLoungebar,
    areaEn: 'Bar & Lounge · Douala Nightlife',
    areaFr: 'Bar & Salon · Ambiance Douala',
    titleEn: 'Evening Bar & Guest Lounge',
    titleFr: 'Bar du Soir & Salon des Clients',
    descEn: 'Chilled local beverages and relaxed lounge seating inside the main hotel wing.',
    descFr: 'Boissons locales fraîches et salon convivial au cœur de l’établissement.',
  },
  {
    id: 'poolbar',
    image: localPoolbar,
    areaEn: 'Amenities · Night Pool Terrace',
    areaFr: 'Équipements · Terrasse Piscine Nocturne',
    titleEn: 'Evening Poolside Bar & Terrace',
    titleFr: 'Piscine Éclairée & Bar Terrasse',
    descEn: 'Illuminated swimming pool and covered terrace seating open every evening for hotel residents.',
    descFr: 'Piscine éclairée et terrasse couverte ouvertes chaque soir pour les résidents de l’hôtel.',
  },
];

export const IMAGE_ASSET_MAP: Record<string, string> = {
  '/src/assets/images/douala_real_hero.jpg': realHero,
  '/src/assets/images/douala_real_onomo.jpg': realOnomo,
  '/src/assets/images/douala_raw_fan_room.jpg': rawFanRoom,
  '/src/assets/images/douala_raw_fan_tv.jpg': rawFanTv,
  '/src/assets/images/douala_raw_red_room.jpg': rawRedRoom,
  '/src/assets/images/douala_raw_red_wall.jpg': rawRedWall,
  '/src/assets/images/douala_raw_superair.jpg': rawSuperair,
  '/src/assets/images/douala_raw_kitchenette.jpg': rawKitchenette,
  '/src/assets/images/douala_raw_grey_suite.jpg': rawGreySuite,
  '/src/assets/images/douala_raw_bath_euro.jpg': rawBathEuro,
  '/src/assets/images/douala_raw_orange_room.jpg': rawOrangeRoom,
  '/src/assets/images/douala_raw_partition_bath.jpg': rawPartitionBath,
  '/src/assets/images/douala_raw_blueyellow.jpg': rawBlueYellow,
  '/src/assets/images/douala_raw_studio_salon.jpg': rawStudioSalon,
  '/src/assets/images/douala_local_classic.jpg': localClassic,
  '/src/assets/images/douala_local_greenwall.jpg': localGreenwall,
  '/src/assets/images/douala_local_akwahin.jpg': localAkwahin,
  '/src/assets/images/douala_local_regina.jpg': localRegina,
  '/src/assets/images/douala_local_valance.jpg': localValance,
  '/src/assets/images/douala_local_tubsuite.jpg': localTubsuite,
  '/src/assets/images/douala_local_poolbar.jpg': localPoolbar,
  '/src/assets/images/douala_local_loungebar.jpg': localLoungebar,
  '/src/assets/images/douala_local_courtyard.jpg': localCourtyard,
  '/src/assets/images/douala_akwa_deluxe.jpg': akwaDeluxe,
  '/src/assets/images/douala_akwa_overview.jpg': akwaOverview,
  '/src/assets/images/douala_akwa_senior.jpg': akwaSenior,
  '/src/assets/images/douala_krystal_classic.jpg': krystalClassic,
  '/src/assets/images/douala_krystal_deluxe_new.jpg': krystalDeluxeNew,
  '/src/assets/images/douala_krystal_exec.jpg': krystalExec,
  '/src/assets/images/douala_krystal_mandela.jpg': krystalMandela,
  '/src/assets/images/douala_krystal_meugang.jpg': krystalMeugang,
  '/src/assets/images/douala_krystal_premium.jpg': krystalPremium,
  '/src/assets/images/douala_pullman_room.jpg': pullmanPool,
  '/src/assets/images/douala_ibis_room.jpg': ibisLobby,
};

export const ROOM_IMAGE_PRESETS = [
  {
    labelEn: 'Bonanjo Fan Standard Room (Douala)',
    labelFr: 'Chambre Standard Ventilée Bonanjo (Douala)',
    path: '/src/assets/images/douala_raw_fan_room.jpg',
    preview: rawFanRoom,
  },
  {
    labelEn: 'Akwa Red-Wall Double (Douala)',
    labelFr: 'Chambre Double Rouge Akwa (Douala)',
    path: '/src/assets/images/douala_raw_red_room.jpg',
    preview: rawRedRoom,
  },
  {
    labelEn: 'Deido Split-AC Studio (Douala)',
    labelFr: 'Studio Climatisé Deido (Douala)',
    path: '/src/assets/images/douala_raw_superair.jpg',
    preview: rawSuperair,
  },
  {
    labelEn: 'Bonapriso Tile Suite (Douala)',
    labelFr: 'Suite Carrelée Bonapriso (Douala)',
    path: '/src/assets/images/douala_raw_grey_suite.jpg',
    preview: rawGreySuite,
  },
  {
    labelEn: 'Terracotta Wall Suite (Douala)',
    labelFr: 'Suite Mur Terracotta (Douala)',
    path: '/src/assets/images/douala_raw_orange_room.jpg',
    preview: rawOrangeRoom,
  },
  {
    labelEn: 'Douala Balcony Double Residence (Douala)',
    labelFr: 'Résidence Balcon Douala',
    path: '/src/assets/images/douala_raw_blueyellow.jpg',
    preview: rawBlueYellow,
  },
];

export function resolveHotelImage(pathOrUrl: string | undefined): string {
  if (!pathOrUrl) return rawFanRoom;
  return IMAGE_ASSET_MAP[pathOrUrl] || pathOrUrl;
}
