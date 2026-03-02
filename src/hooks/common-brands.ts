/**
 * ==================== 常见服装品牌列表 ====================
 * 用于品牌下拉选择和模糊搜索
 */

export const COMMON_BRANDS = [
  // 国际运动品牌
  'Nike', 'Adidas', 'Puma', 'New Balance', 'Under Armour', 'Asics', 'Converse', 'Vans', 'Reebok', 'Fila',
  'Jordan', 'Asics', 'Skechers', 'Salomon', 'DC', 'Etnies',
  
  // 国际快时尚
  'Zara', 'H&M', 'Uniqlo', 'Gap', 'Massimo Dutti', 'COS', '& Other Stories', 'Arket', 'Everlane',
  'Uniqlo', 'GU', 'Pull&Bear', 'Stradivarius', 'Bershka', 'Mango',
  
  // 国际奢侈品牌
  'Louis Vuitton', 'Gucci', 'Prada', 'Hermès', 'Chanel', 'Dior', 'Balenciaga', 'Versace',
  'Burberry', 'Valentino', 'Saint Laurent', 'Alexander McQueen', 'Givenchy', 'Bottega Veneta',
  'Celine', 'Loewe', 'Miu Miu', 'Fendi', 'Dolce & Gabbana', 'Armani',
  
  // 国际设计师品牌
  'Acne Studios', 'Off-White', 'Supreme', 'Stussy', 'Kith', 'A Bathing Ape', 'Palace',
  'Carhartt', 'Dickies', 'Levi\'s', 'Wrangler', 'Calvin Klein', 'Tommy Hilfiger',
  'Ralph Lauren', 'Hugo Boss', 'DKNY', 'Michael Kors', 'Coach', 'Tory Burch',
  
  // 国内运动品牌
  '李宁', '安踏', '361°', '特步', '匹克', '鸿星尔克', '361度', '回力', '飞跃',
  
  // 国内快时尚
  '优衣库', '海澜之家', '森马', '美特斯邦威', '真维斯', '以纯', '唐狮', 'GXG',
  '太平鸟', '欧时力', '江南布衣', '播', '日播', '拉夏贝尔', 'vero moda', 'only',
  
  // 国内奢侈/设计师
  'ICICLE', 'ELLASSAY', 'Koradior', 'Naersi', 'PSALTER', '13TH', 'M SOUVENIR',
  
  // 鞋履品牌
  'Nike', 'Adidas', 'Jordan', 'New Balance', 'Puma', 'Converse', 'Vans', 'Dr. Martens',
  'Clarks', 'ECCO', 'Skechers', 'ASICS', 'Salomon', 'UGG', 'Timberland',
  'Crocs', 'Fitflop', 'Clarks', 'Bally', 'Tods',
  
  // 箱包品牌
  'Louis Vuitton', 'Gucci', 'Prada', 'Hermès', 'Chanel', 'Dior', 'Balenciaga', 'Versace',
  'Burberry', 'Coach', 'Michael Kors', 'Tory Burch', 'Kate Spade', 'Furla', 'Longchamp',
  'MCM', 'Bottega Veneta', 'Celine', 'Loewe',
  
  // 配饰/珠宝
  'Cartier', 'Tiffany', 'Bvlgari', 'Van Cleef', 'Piaget', 'Chopard', 'Swarovski', '潘多拉',
  '周大福', '周生生', '六福珠宝', '老凤祥', '潮宏基', '周大生',
  
  // 内衣/家居
  'Victoria\'s Secret', 'Calvin Klein', 'Emporio Armani', 'Triumph', 'Wacoal', 'Intimissimi',
  '优衣库', '曼妮芬', '安莉芳', '古今', '爱慕',
  
  // 户外/机能
  'The North Face', 'Columbia', 'Patagonia', 'Arc\'teryx', 'Mammut', 'Marmot',
  'Jack Wolfskin', 'Decathlon', 'Kailas', '探路者', '骆驼', '圣弗莱',
  
  // 牛仔品牌
  'Levi\'s', 'Wrangler', 'Lee', 'Gap', 'Uniqlo', 'G-Star', 'True Religion',
  '7 For All Mankind', 'Citizens of Humanity', 'J Brand',
  
  // 潮牌
  'Supreme', 'Off-White', 'Stussy', 'Palace', 'Kith', 'Bape', 'Neighborhood',
  'Visvim', 'Fragment Design', 'Acronym', 'Y-3', 'Undercover',
  
  // 设计师品牌
  'Comme des Garçons', 'Issey Miyake', 'Yohji Yamamoto', 'Undercover', 'Maison Margiela',
  'Ann Demeulemeester', 'Rick Owens', 'Julius', 'Dior Homme', 'Saint Laurent',
  
  // 轻奢/高街
  'Massimo Dutti', 'COS', 'Arket', '& Other Stories', 'Reiss', 'Joseph', 'Sezane',
  'Sandro', 'Maje', 'Claudie Pierlot', 'Vanessa Seward', 'The Row', 'Jil Sander',
  
  // 运动休闲
  'Lululemon', 'Athleta', 'Gap', 'Nike', 'Adidas', 'Under Armour', 'Sweaty Betty',
  'Beyond Yoga', 'Prana', 'Patagonia',
  
  // 婴童/亲子
  'Zara Kids', 'H&M Kids', 'Gap Kids', 'Uniqlo Kids', 'Mothercare', 'Carter\'s',
  'Old Navy', 'Gymboree', 'Mini Rodini', 'Boboli',
  
  // 袜子/家居袜
  'Stance', 'Happy Socks', 'Falke', 'Gold Toe', 'Tabio', '厚木', 'ATSUGI',
  '浪莎', '梦娜', '耐尔', '芬那',
  
  // 帽子/围巾
  'New Era', 'Stetson', 'Brixton', 'Goorin Bros', 'Kangol', 'Ralph Lauren',
  'Burberry', 'Acne Studios', 'Issey Miyake',
  
  // 手表
  'Rolex', 'Omega', 'Patek Philippe', 'Audemars Piguet', 'Cartier', 'IWC',
  'TAG Heuer', 'Longines', 'Tissot', 'Seiko', 'Casio', 'Citizen',
  '天梭', '浪琴', '欧米茄', '劳力士', '卡西欧', '天美时',
  
  // 香水
  'Chanel', 'Dior', 'Gucci', 'YSL', 'Tom Ford', 'Versace', 'Burberry',
  'Jo Malone', 'Le Labo', 'Byredo', 'Diptyque', 'Penhaligon\'s',
  '祖玛珑', '香奈儿', '迪奥', '古驰', '汤姆福特', '宝格丽',
  
  // 护肤/美妆（服装品牌跨界）
  'Chanel Beauty', 'Dior Beauty', 'YSL Beauty', 'Gucci Beauty', 'Burberry Beauty',
  'Armani Beauty', 'Valentino Beauty', 'Prada Beauty',
  
  // 皮带/皮带
  'Louis Vuitton', 'Gucci', 'Hermès', 'Prada', 'Burberry', 'Coach', 'Calvin Klein',
  'Lee', 'Levi\'s', '万宝龙', '金利来', '沙驰', '皮尔卡丹',
  
  // 领带/领结
  'Hermès', 'Burberry', 'Ralph Lauren', 'Tommy Hilfiger', 'Hugo Boss',
  'Armani', 'Z Zegna', 'Canali', 'Brioni',
  
  // 围巾/披肩
  'Burberry', 'Hermès', 'Louis Vuitton', 'Gucci', 'Chanel', 'Dior',
  'Acne Studios', 'Issey Miyake', 'Max Mara', 'Johnstons',
];

/**
 * 按首字母分组（用于显示）
 */
export const BRANDS_BY_LETTER: Record<string, string[]> = COMMON_BRANDS.reduce((acc, brand) => {
  const firstChar = brand[0].toUpperCase();
  if (!acc[firstChar]) acc[firstChar] = [];
  acc[firstChar].push(brand);
  return acc;
}, {} as Record<string, string[]>);

/**
 * 获取所有品牌（去重后）
 */
export const getAllBrands = (): string[] => {
  return [...new Set(COMMON_BRANDS)].sort();
};

/**
 * 模糊搜索品牌
 * @param query 搜索关键词
 * @param limit 返回结果数量限制
 */
export const searchBrands = (query: string, limit: number = 10): string[] => {
  if (!query || query.trim() === '') {
    return [];
  }
  
  const lowerQuery = query.toLowerCase().trim();
  const allBrands = getAllBrands();
  
  // 优先精确匹配开头，其次包含匹配
  const results = allBrands
    .filter(brand => brand.toLowerCase().includes(lowerQuery))
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(lowerQuery);
      const bStarts = b.toLowerCase().startsWith(lowerQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    })
    .slice(0, limit);
  
  return results;
};
