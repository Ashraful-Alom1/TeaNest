import { Product, Supplier, BusinessSettings, AdminUser, BlogPost } from '@tea-nest/types';
import { DEFAULT_BUSINESS_SETTINGS } from './constants';

export const SEED_ADMIN: AdminUser = {
  uid: 'admin_super_teanest',
  email: 'admin@teanest.in',
  phone: '+91 98540 12345',
  name: 'Tea Nest Super Admin',
  role: 'SUPER_ADMIN',
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const SEED_SUPPLIER: Supplier = {
  id: 'sup_naharkatia_estate',
  name: 'Pranab Borah',
  companyName: 'Brahmaputra Organic Tea Estates',
  phone: '+91 98540 11223',
  email: 'estate@brahmaputratea.com',
  gstin: '18AAECB4921K1ZF',
  address: 'Naharkatia Tea Division, Plot 42',
  city: 'Dibrugarh',
  state: 'Assam',
  pincode: '786610',
  paymentTerms: 'Net 30',
  openingBalance: 0,
  currentBalance: 0,
  status: 'ACTIVE',
  notes: 'Primary supplier of premium first-flush Assam orthodox and CTC black tea leaves.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const SEED_PRODUCT: Product = {
  id: 'prod_tea_assam_500g',
  name: 'Assam Black Tea',
  slug: 'assam-black-tea',
  description:
    'Rich • Refreshing • Aromatic. Carefully handpicked from the finest tea gardens of Dibrugarh, our teas are crafted to bring you a pure, refreshing and enriching experience in every cup.',
  sku: 'TN-ABT-500G',
  categoryId: 'black-tea',
  categoryName: 'Assam Black Tea',
  weight: 500,
  unit: 'g',
  mrp: 499,
  sellingPrice: 450,
  purchasePrice: 220,
  gstRate: 5,
  hsnCode: '0902',
  stockQuantity: 100,
  stockReferenceQty: 100,
  lowStockPercent: 70,
  lowStockThresholdQty: 70, // 100 * 70% = 70
  images: [
    {
      cloudinaryPublicId: 'tea-nest/products/assam-black-tea/front',
      secureUrl: '/images/tea_nest_front.jpg',
      width: 1080,
      height: 1920,
      altText: 'Tea Nest Assam Black Tea 500g Stand-up Pouch Front',
      sortOrder: 1,
    },
    {
      cloudinaryPublicId: 'tea-nest/products/assam-black-tea/back',
      secureUrl: '/images/tea_nest_back.jpg',
      width: 1080,
      height: 1920,
      altText: 'Tea Nest Assam Black Tea 500g Stand-up Pouch Back Info Label',
      sortOrder: 2,
    },
  ],
  thumbnail: {
    cloudinaryPublicId: 'tea-nest/products/assam-black-tea/front',
    secureUrl: '/images/tea_nest_front.jpg',
    width: 1080,
    height: 1920,
    altText: 'Tea Nest Assam Black Tea 500g Thumbnail',
    sortOrder: 1,
  },
  isPublished: true,
  isFeatured: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'admin@teanest.in',
};

export const SEED_BUSINESS_SETTINGS: BusinessSettings = DEFAULT_BUSINESS_SETTINGS;

export const SEED_BLOGS: BlogPost[] = [
  {
    id: 'blog_chai_to_single_origin',
    title: 'From Chai to Single-Origin Tea: The New Indian Tea Consumer',
    slug: 'from-chai-to-single-origin-tea',
    excerpt: 'How urban connoisseurs are rediscovering estate-direct orthodox leaf alongside daily kadak chai.',
    content: `For decades in India, tea was synonymous with spiced milk chai—a comforting, sweet, heavily boiled concoction of CTC tea, ginger, and cardamom. While that beloved morning ritual remains deeply woven into the country's fabric, a quiet renaissance has taken root across Indian teacups.

### The Rise of the Connoisseur
Today's discerning tea drinker wants to know where their leaves were plucked, at what elevation, and during which flush. Similar to the specialty coffee and craft chocolate revolutions, tea enthusiasts are seeking out single-origin orthodox teas that celebrate terroir.

### What Makes Upper Assam Unique?
In the mist-laden lowlands flanking the Brahmaputra River, particularly surrounding Dibrugarh and Naharkatia, tea bushes thrive in dense alluvial soil, heavy seasonal monsoons, and high humidity. This unique microclimate yields the world-renowned *Camellia sinensis var. assamica*, distinguished by:
- Deep amber, golden-tipped liquor
- Pronounced malty sweetness
- A brisk, invigorating body that stands tall both neat and with a splash of warm milk

### Moving Beyond Mass-Market Blends
Commercial supermarket brands typically blend hundreds of dust-grade teas from disparate estates to maintain an artificial, uniform baseline. In contrast, **Tea Nest** sources whole and broken orthodox leaf directly from certified gardens. By shortening the supply chain from months to mere days, drinkers experience the true volatile essential oils and rich antioxidants of fresh first-flush pluckings.

Next time you steep your morning cup, pause before reaching for milk and sugar. Sip it clear, inhale the muscatel and malt aromatics, and taste two centuries of Assam heritage in a single brew.`,
    coverImage: {
      secureUrl: '/images/tea_nest_front.jpg',
      altText: 'Tea Nest Assam Orthodox Leaf',
    },
    author: 'Tea Nest Editorial',
    category: 'Tea Culture',
    tags: ['Tea Culture', 'Single Origin', 'Assam Tea', 'Artisanal'],
    readTime: '4 min read',
    isPublished: true,
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdBy: 'admin@teanest.in',
  },
  {
    id: 'blog_5_brewing_mistakes',
    title: '5 Brewing Mistakes That Are Ruining Your Cup (And How to Fix Them)',
    slug: '5-brewing-mistakes-ruining-your-cup',
    excerpt: 'Water temperature, steeping time, and leaf ratio: the exact secrets to extracting brisk liquor without bitterness.',
    content: `Brewing premium orthodox tea is both an art and a simple science. Even the highest-grade golden-tipped Assam leaf can turn harsh, flat, or astringent if prepared carelessly. Here are the five most common brewing mistakes and how to brew perfection every single time.

### 1. Using Scalding Boiling Water Directly
While CTC black tea withstands rolling boils, delicate whole-leaf orthodox black tea thrives best at **90°C to 95°C**. 
* **Fix**: Bring fresh water to a boil, then remove from heat and let it rest for 45 to 60 seconds before pouring over your leaves.

### 2. Over-Steeping Past Four Minutes
Leaving leaves in the teapot indefinitely extracts heavy, bitter tannins and masks the floral malt character.
* **Fix**: For standard 2.5g of leaves per 200ml cup, steep strictly for **3 to 4 minutes**. Strain completely or decant immediately into cups.

### 3. Reboiling Stale Water
Reheating water repeatedly depletes dissolved oxygen, resulting in a dull, lifeless liquor lacking briskness.
* **Fix**: Always start with cold, fresh filtered water. Aerated water brings out the brisk sparkle of Assam orthodox leaf.

### 4. Eyeballing Leaf Quantity
Using a small kitchen teaspoon often leads to under-dosing or over-dosing, depending on leaf curl density.
* **Fix**: Use approximately 2 to 2.5 grams of orthodox leaf for every 180–200 ml of water (roughly one heaping teaspoon).

### 5. Storing Tea in Clear Glass or Near Spices
Tea leaves are hygroscopic sponges—they avidly absorb ambient moisture, sunlight, and strong kitchen odors.
* **Fix**: Keep your Tea Nest zip-lock pouch tightly sealed in a cool, dark cupboard away from spice jars. Freshness is key to aromatic richness.`,
    coverImage: {
      secureUrl: '/images/hero_slide_2.jpg',
      altText: 'Fresh Assam Tea Plucking at Sunset',
    },
    author: 'Master Blender, Naharkatia',
    category: 'Brewing Masterclass',
    tags: ['Brewing Guide', 'Tea Masterclass', 'Black Tea'],
    readTime: '5 min read',
    isPublished: true,
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdBy: 'admin@teanest.in',
  },
  {
    id: 'blog_story_of_assam_tea',
    title: 'The Tea That Changed Afternoon Tea Forever: The Story of Assam',
    slug: 'story-of-assam-tea',
    excerpt: "How Naharkatia and the Upper Brahmaputra valley established the world's most invigorating breakfast brew.",
    content: `Before the early 19th century, the global tea trade was an absolute monopoly held by Imperial China. Britain traded silver for Chinese green and bohea teas, unaware that deep within the dense subtropical jungles of Northeast India, an indigenous wild tea plant had been cherished for generations by local tribes.

### The Singpho Secret
The Singpho and Khamti peoples of Upper Assam brewed *Phikap*—sun-dried wild tea leaves steeped in bamboo hollows. In 1823, a Scottish merchant and adventurer named Robert Bruce met Singpho chief Bessa Gam, who introduced him to these wild, thick-leaved evergreen trees growing naturally in the hills of Naharkatia and Sadiya.

Botanical analysis in Calcutta initially caused uproar: it was declared a distinct variety, *Camellia sinensis var. assamica*, with larger leaves, deeper root systems, and higher natural caffeine content than Chinese varieties.

### The Birth of the Assam Liquor
By 1838, the first consignment of twelve tea chests arrived at London's East India Docks, commanding staggering auction prices. Connoisseurs marveled at its dark garnet liquor, natural sweetness, and punchy maltiness that held up magnificently against cold climates and splash of full-cream milk.

### Tea Nest: Carrying the Legacy Forward
Today, nearly two centuries later, Tea Nest honors this heritage. Nestled in the Naharkatia estate belt of Dibrugarh, our garden managers adhere to traditional orthodox processing—careful withering, gentle orthodox rolling that preserves leaf tips, and timed oxidation that imparts that unmistakable golden hue.

Every pack of Tea Nest is a direct continuation of Assam's historic gift to world culture.`,
    coverImage: {
      secureUrl: '/images/tea_nest_back.jpg',
      altText: 'Assam Tea Garden Heritage',
    },
    author: 'Brahmaputra Heritage Trust',
    category: 'Assam History',
    tags: ['Assam History', 'Tea Heritage', 'Brahmaputra', 'Naharkatia'],
    readTime: '6 min read',
    isPublished: true,
    publishedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    createdBy: 'admin@teanest.in',
  },
];
