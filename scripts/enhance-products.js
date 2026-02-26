import fs from 'fs';
import path from 'path';

const inputFile = path.join(process.cwd(), 'INF4027W_MiniPRJ_Products.json');
const outputFile = path.join(process.cwd(), 'INF4027W_MiniPRJ_Products_Enhanced.json');

function decodeUnicode(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\\u00a0/g, ' ')
    .replace(/\\u2019/g, "'")
    .replace(/\\u2018/g, "'")
    .replace(/\\u201d/g, '"')
    .replace(/\\u201c/g, '"')
    .replace(/\\u2014/g, '-')
    .replace(/\\u2013/g, '-')
    .replace(/\\u00e9/g, 'é')
    .replace(/\\u00e8/g, 'è')
    .replace(/\\u00e0/g, 'à')
    .replace(/\\u00f1/g, 'ñ')
    .replace(/\\u2122/g, '(TM)')
    .replace(/\\u00ae/g, '(R)')
    .replace(/\\u2714/g, '✓')
    .replace(/\\ufe0f/g, '')
    .replace(/\\u2022/g, '•')
    .replace(/\\u2026/g, '...')
    .replace(/\\u00b0/g, '°')
    .replace(/\\u00d7/g, '×')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateHandle(name) {
  return decodeUnicode(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractKeywords(product) {
  const keywords = new Set();
  
  keywords.add(product.brand?.toLowerCase() || 'shara hair za');
  keywords.add('wigs');
  
  const attr = product.attributes || {};
  if (attr.grade) keywords.add(attr.grade.toLowerCase());
  if (attr.material) keywords.add(attr.material.toLowerCase());
  if (attr.color) keywords.add(attr.color.toLowerCase().replace(' colour', ''));
  if (attr.closure) {
    const closure = attr.closure.toLowerCase();
    if (closure.includes('glueless')) keywords.add('glueless');
    if (closure.includes('frontal')) keywords.add('frontal');
    if (closure.includes('5x5')) keywords.add('5x5');
    if (closure.includes('6x6')) keywords.add('6x6');
    if (closure.includes('13x6')) keywords.add('13x6');
  }
  
  if (product.name) {
    const nameLower = product.name.toLowerCase();
    if (nameLower.includes('straight')) keywords.add('bone straight');
    if (nameLower.includes('wave')) keywords.add('wave');
    if (nameLower.includes('curly')) keywords.add('curly');
    if (nameLower.includes('bob')) keywords.add('bob');
    if (nameLower.includes('ombre')) keywords.add('ombre');
    if (nameLower.includes('blonde') || nameLower.includes('platinum')) keywords.add('blonde');
    if (nameLower.includes('brown') || nameLower.includes('chocolate')) keywords.add('brown');
  }
  
  return Array.from(keywords).slice(0, 10);
}

function generateSearchTags(product) {
  const tags = [];
  
  tags.push(product.brand?.toLowerCase() || 'shara hair za');
  
  const attr = product.attributes || {};
  if (attr.color) {
    const color = attr.color.toLowerCase().replace(' colour', '').replace('1/', '');
    if (!tags.includes(color)) tags.push(color);
  }
  if (attr.grade) tags.push(attr.grade.toLowerCase());
  
  const nameLower = product.name.toLowerCase();
  if (nameLower.includes('straight')) tags.push('bone straight', 'straight');
  if (nameLower.includes('wave')) tags.push('body wave', 'deep wave', 'water wave');
  if (nameLower.includes('curly')) tags.push('curly', 'kinky curly');
  if (nameLower.includes('bob')) tags.push('bob wig');
  if (nameLower.includes('glueless')) tags.push('glueless');
  if (nameLower.includes('frontal')) tags.push('frontal');
  if (nameLower.includes('ombre')) tags.push('ombre');
  
  return [...new Set(tags)].slice(0, 8);
}

function getMaintenanceLevel(product) {
  const nameLower = product.name.toLowerCase();
  const attr = product.attributes || {};
  
  if (nameLower.includes('straight') || attr.material?.toLowerCase().includes('straight')) {
    return 'low';
  }
  if (nameLower.includes('wave')) {
    return 'medium';
  }
  if (nameLower.includes('curly') || nameLower.includes('kinky')) {
    return 'high';
  }
  return 'medium';
}

function getOccasion(product) {
  const nameLower = product.name.toLowerCase();
  const occasions = [];
  
  occasions.push('daily');
  
  if (nameLower.includes('lux') || nameLower.includes('premium') || product.price > 5000) {
    occasions.push('wedding', 'special occasions');
  }
  if (nameLower.includes('bob') || nameLower.includes('short')) {
    occasions.push('professional');
  }
  if (nameLower.includes('party')) {
    occasions.push('party');
  }
  
  return [...new Set(occasions)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString();
}

function fixAttributes(attr) {
  if (!attr) return {};
  
  let closure = attr.closure || '';
  let length = attr.length || '';
  let color = attr.color || '';
  
  if (closure.includes('inch')) {
    const inchMatch = closure.match(/(\d+)\s*inch/i);
    if (inchMatch && !length.includes('inch')) {
      length = closure;
      closure = attr.grade?.toLowerCase().includes('full') ? 'Full Frontal' : 
               attr.closure?.toLowerCase().includes('5x5') ? '5x5' :
               attr.closure?.toLowerCase().includes('6x6') ? '6x6' : 
               attr.closure?.toLowerCase().includes('2x6') ? '2x6' : 'Default';
    }
  }
  
  if (closure === 'Default Title') {
    closure = 'Default';
  }
  
  if (color.includes(' colour')) {
    color = color.replace(' colour', '');
  }
  
  if (color === '1/Brown') {
    color = 'Brown';
  }
  
  if (length.includes(',')) {
    const lengths = length.split(',').map(l => l.trim());
    length = lengths[0];
  }
  
  return {
    ...attr,
    closure,
    length,
    color
  };
}

function processProducts(products) {
  const now = new Date();
  const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  const productNames = new Set();
  
  return products.map((product, index) => {
    const createdAt = randomDate(yearAgo, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    const updatedAt = randomDate(createdAt, now);
    
    const isNewArrival = (now.getTime() - createdAt.getTime()) < 60 * 24 * 60 * 60 * 1000;
    
    const isInStock = Math.random() < 0.8;
    const quantity = isInStock ? Math.floor(Math.random() * 45) + 5 : 0;
    const reserved = isInStock ? Math.floor(Math.random() * 3) : 0;
    
    const trendingScore = Math.floor(Math.random() * 10) + 1;
    
    const featured = Math.random() < 0.2;
    
    const nameKey = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isDuplicate = productNames.has(nameKey);
    productNames.add(nameKey);
    
    const handle = generateHandle(product.name);
    
    const fixedAttributes = fixAttributes(product.attributes);
    
    const enhanced = {
      id: product.id,
      name: decodeUnicode(product.name),
      variant_name: decodeUnicode(product.variant_name),
      brand: product.brand,
      category: product.category,
      price: product.price,
      cost_price: product.cost_price,
      description: decodeUnicode(product.description),
      image_url: product.image_url,
      tags: product.tags && product.tags.length > 0 ? product.tags : generateSearchTags(product),
      attributes: fixedAttributes,
      
      seo: {
        handle: isDuplicate ? `${handle}-${product.variant_name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || index}` : handle,
        title: decodeUnicode(product.name),
        description: decodeUnicode(product.description)?.substring(0, 160) || '',
        keywords: extractKeywords(product)
      },
      
      metadata: {
        trending_score: trendingScore,
        search_tags: generateSearchTags(product),
        occasion: getOccasion(product),
        suitable_face_shapes: ['oval', 'round', 'heart', 'square'],
        maintenance_level: getMaintenanceLevel(product),
        featured: featured,
        new_arrival: isNewArrival
      },
      
      inventory: {
        inStock: isInStock,
        quantity: quantity,
        reserved: reserved
      },
      
      ratings: {
        average: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
        count: Math.floor(Math.random() * 100)
      },
      
      timestamps: {
        createdAt: formatDate(createdAt),
        updatedAt: formatDate(updatedAt)
      }
    };
    
    return enhanced;
  });
}

function main() {
  console.log('Reading input file...');
  const inputData = fs.readFileSync(inputFile, 'utf8');
  const products = JSON.parse(inputData);
  
  console.log(`Processing ${products.length} products...`);
  const enhancedProducts = processProducts(products);
  
  console.log('Writing output file...');
  fs.writeFileSync(outputFile, JSON.stringify(enhancedProducts, null, 2), 'utf8');
  
  console.log(`\n✅ Enhancement complete!`);
  console.log(`   Input:  ${inputFile}`);
  console.log(`   Output: ${outputFile}`);
  console.log(`   Products processed: ${enhancedProducts.length}`);
  
  const inStockCount = enhancedProducts.filter(p => p.inventory.inStock).length;
  const featuredCount = enhancedProducts.filter(p => p.metadata.featured).length;
  const newArrivalsCount = enhancedProducts.filter(p => p.metadata.new_arrival).length;
  
  console.log(`\n📊 Summary:`);
  console.log(`   In stock: ${inStockCount}/${enhancedProducts.length}`);
  console.log(`   Featured: ${featuredCount}`);
  console.log(`   New arrivals: ${newArrivalsCount}`);
}

main();
