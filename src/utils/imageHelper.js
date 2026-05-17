// Curated Unsplash photo IDs — stable, no random failures like source.unsplash.com
const PHOTO_IDS = {
  Nature: [
    'photo-1441974231531-c6227db76b6e',
    'photo-1469474968028-56623f02e42e',
    'photo-1426604966848-d7adac402bff',
    'photo-1472214103451-9374bd1c798e',
    'photo-1433086966358-54859d0ed716',
    'photo-1501854140801-50d01698950b',
    'photo-1518173946687-a4c8892bbd9f',
  ],
  nature: [
    'photo-1441974231531-c6227db76b6e',
    'photo-1469474968028-56623f02e42e',
    'photo-1426604966848-d7adac402bff',
    'photo-1472214103451-9374bd1c798e',
    'photo-1433086966358-54859d0ed716',
    'photo-1501854140801-50d01698950b',
  ],
  History: [
    'photo-1589519160732-57fc498494f8',
    'photo-1564507592333-c60657eea523',
    'photo-1539650116574-75c0c6d73f6e',
    'photo-1558618666-fcd25c85cd64',
    'photo-1486325212027-8081e485255e',
  ],
  historic: [
    'photo-1589519160732-57fc498494f8',
    'photo-1564507592333-c60657eea523',
    'photo-1539650116574-75c0c6d73f6e',
    'photo-1558618666-fcd25c85cd64',
  ],
  viewpoint: [
    'photo-1506905925346-21bda4d32df4',
    'photo-1464822759023-fed622ff2c3b',
    'photo-1501854140801-50d01698950b',
    'photo-1476514525535-07fb3b4ae5f1',
    'photo-1507003211169-0a1dd7228f2d',
  ],
  beach: [
    'photo-1507525428034-b723cf961d3e',
    'photo-1519046904884-53103b34b206',
    'photo-1473116763249-2faaef81ccda',
    'photo-1437719417032-8595fd9e9dc6',
    'photo-1534430480872-3498386e7856',
  ],
  hidden: [
    'photo-1448375240586-882707db888b',
    'photo-1445308394109-4ec2920981b1',
    'photo-1518495973542-4542c06a5843',
    'photo-1510797215324-95aa89f43c33',
    'photo-1470770841072-f978cf4d019e',
  ],
  Food: [
    'photo-1504674900247-0877df9cc836',
    'photo-1493770348161-369560ae357d',
    'photo-1414235077428-338989a2e8c0',
    'photo-1565299585323-38d6b0865b47',
  ],
  food: [
    'photo-1504674900247-0877df9cc836',
    'photo-1493770348161-369560ae357d',
    'photo-1414235077428-338989a2e8c0',
  ],
  local: [
    'photo-1493770348161-369560ae357d',
    'photo-1504674900247-0877df9cc836',
    'photo-1445116572257-6be0c2952f66',
  ],
  Adventure: [
    'photo-1551632811-561732d1e306',
    'photo-1522163182402-834f871fd851',
    'photo-1483728642387-6c3bdd6c93e5',
    'photo-1464207687429-7505649dae38',
  ],
  Art: [
    'photo-1541961017774-22349e4a1262',
    'photo-1501366062246-723b4d3e4eb6',
    'photo-1558618666-fcd25c85cd64',
  ],
  waterfall: [
    'photo-1433086966358-54859d0ed716',
    'photo-1518173946687-a4c8892bbd9f',
    'photo-1426604966848-d7adac402bff',
    'photo-1502082553048-f009c37129b9',
  ],
  trail: [
    'photo-1441974231531-c6227db76b6e',
    'photo-1469474968028-56623f02e42e',
    'photo-1501854140801-50d01698950b',
  ],
  forest: [
    'photo-1448375240586-882707db888b',
    'photo-1441974231531-c6227db76b6e',
    'photo-1426604966848-d7adac402bff',
  ],
  lake: [
    'photo-1472214103451-9374bd1c798e',
    'photo-1476514525535-07fb3b4ae5f1',
    'photo-1507003211169-0a1dd7228f2d',
  ],
  cave: [
    'photo-1518495973542-4542c06a5843',
    'photo-1445308394109-4ec2920981b1',
    'photo-1510797215324-95aa89f43c33',
  ],
  default: [
    'photo-1506905925346-21bda4d32df4',
    'photo-1469474968028-56623f02e42e',
    'photo-1441974231531-c6227db76b6e',
    'photo-1501854140801-50d01698950b',
    'photo-1472214103451-9374bd1c798e',
  ],
};

export function getPlaceImage(category = 'default', index = 0, w = 600, h = 400) {
  const pool = PHOTO_IDS[category] || PHOTO_IDS.default;
  const id = pool[Math.abs(index) % pool.length];
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}

export function getFallbackImage(category = 'default', w = 600, h = 400) {
  const pool = PHOTO_IDS[category] || PHOTO_IDS.default;
  const id = pool[Math.floor(Math.random() * pool.length)];
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}
