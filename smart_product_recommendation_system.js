// smartRecommendationSystem.js
// Built as an extension of the provided template (core dictionary, heap, graph ideas).
// Implements:
// - product dictionary for O(1) lookups
// - MaxHeap/MinHeap with comparator
// - Weighted product graph (co-purchase weights)
// - Functions: trending, category-similar, co-purchase recommendations, personalized recommendations
// - Example dataset + demo usage

// ---------- Core product store (dictionary) ----------
const products = {
  1: { id: 1, name: "Laptop", category: "Electronics", price: 1000, quantity: 5, popularity: 50 },
  2: { id: 2, name: "Phone", category: "Electronics", price: 800, quantity: 10, popularity: 100 },
  3: { id: 3, name: "Phone Case", category: "Accessories", price: 20, quantity: 50, popularity: 20 },
  4: { id: 4, name: "Charger", category: "Accessories", price: 25, quantity: 30, popularity: 70 },
  5: { id: 5, name: "Wireless Mouse", category: "Electronics", price: 40, quantity: 25, popularity: 40 },
  6: { id: 6, name: "USB-C Cable", category: "Accessories", price: 10, quantity: 100, popularity: 60 },
  7: { id: 7, name: "Headphones", category: "Electronics", price: 120, quantity: 15, popularity: 80 },
};

function addProduct(product) { products[product.id] = product; }
function updateProduct(id, updates) { if (products[id]) products[id] = { ...products[id], ...updates }; }
function deleteProduct(id) { delete products[id]; }
function searchProductByName(name) { return Object.values(products).filter(p => p.name.toLowerCase().includes(name.toLowerCase())); }

// ---------- Generic Heap (supports max or min via comparator) ----------
class Heap {
  constructor(comparator = (a, b) => a > b) {
    this.heap = [];
    this.compare = comparator; // should return true if a has higher priority than b
  }

  size() { return this.heap.length; }
  isEmpty() { return this.size() === 0; }

  insert(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  peek() { return this.heap[0] ?? null; }

  extract() {
    if (this.isEmpty()) return null;
    if (this.size() === 1) return this.heap.pop();
    const root = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._sinkDown(0);
    return root;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parent])) {
        [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
        index = parent;
      } else break;
    }
  }

  _sinkDown(index) {
    const n = this.size();
    while (true) {
      let best = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      if (left < n && this.compare(this.heap[left], this.heap[best])) best = left;
      if (right < n && this.compare(this.heap[right], this.heap[best])) best = right;
      if (best === index) break;
      [this.heap[index], this.heap[best]] = [this.heap[best], this.heap[index]];
      index = best;
    }
  }
}

// Convenience heaps
const MaxHeapByPopularity = () => new Heap((a, b) => a.popularity > b.popularity);
const MinHeapByPrice = () => new Heap((a, b) => a.price < b.price);

// ---------- Weighted product graph (adjacency map: productId -> Map(neighborId -> weight)) ----------
class ProductGraph {
  constructor() {
    this.adj = new Map();
  }

  _ensureNode(id) {
    if (!this.adj.has(id)) this.adj.set(id, new Map());
  }

  // add or increase weight for undirected edge
  addEdge(a, b, weight = 1) {
    this._ensureNode(a); this._ensureNode(b);
    const rowA = this.adj.get(a);
    rowA.set(b, (rowA.get(b) || 0) + weight);
    const rowB = this.adj.get(b);
    rowB.set(a, (rowB.get(a) || 0) + weight);
  }

  neighbors(id) { return this.adj.get(id) || new Map(); }

  // build graph from co-purchase history: an array of purchase sessions (each session is array of productIds)
  buildFromPurchaseHistory(purchaseSessions = []) {
    for (const session of purchaseSessions) {
      // connect every pair in session
      for (let i = 0; i < session.length; i++) {
        for (let j = i + 1; j < session.length; j++) {
          this.addEdge(session[i], session[j], 1);
        }
      }
    }
  }
}

// ---------- Recommendation Algorithms ----------

// 1) Trending: top N by popularity using MaxHeap
function recommendTrending(n = 3) {
  const heap = MaxHeapByPopularity();
  Object.values(products).forEach(p => heap.insert(p));
  const out = [];
  while (n-- > 0 && !heap.isEmpty()) out.push(heap.extract());
  return out;
}

// 2) Category-similar: return products from same category, sorted by popularity (max-heap) excluding the product itself
function recommendByCategory(productId, n = 3) {
  const base = products[productId];
  if (!base) return [];
  const heap = MaxHeapByPopularity();
  Object.values(products).forEach(p => {
    if (p.id !== base.id && p.category === base.category) heap.insert(p);
  });
  const out = [];
  while (n-- > 0 && !heap.isEmpty()) out.push(heap.extract());
  return out;
}

// 3) Co-purchase recommendations: neighbors in weighted graph with highest weight (use a small heap)
function recommendCoPurchased(graph, productId, n = 5) {
  const neighbors = graph.neighbors(productId); // Map(neighborId -> weight)
  const heap = new Heap((a, b) => a.weight > b.weight);
  for (const [nid, weight] of neighbors.entries()) {
    heap.insert({ id: nid, weight, product: products[nid] });
  }
  const out = [];
  while (n-- > 0 && !heap.isEmpty()) out.push(heap.extract());
  return out;
}

// 4) Personalized recommendations (simple collaborative approach):
// For a user with purchase history (array of productIds), score candidate products by summing
// co-purchase weight with user's items * popularity factor. Exclude already purchased items.
function personalizedRecommendations(graph, userPurchaseIds = [], n = 5) {
  const score = new Map(); // productId -> score
  const purchasedSet = new Set(userPurchaseIds);

  for (const pid of userPurchaseIds) {
    const neighbors = graph.neighbors(pid);
    for (const [nid, w] of neighbors.entries()) {
      if (purchasedSet.has(nid)) continue; // skip products they already bought
      const pop = products[nid] ? products[nid].popularity : 0;
      // score: weighted combination — co-purchase weight * log(popularity + 1)
      const contribution = w * Math.log(pop + 1);
      score.set(nid, (score.get(nid) || 0) + contribution);
    }
  }

  // create a heap to get top scored
  const heap = new Heap((a, b) => a.score > b.score);
  for (const [pid, s] of score.entries()) heap.insert({ id: pid, score: s, product: products[pid] });

  const out = [];
  while (n-- > 0 && !heap.isEmpty()) out.push(heap.extract());
  return out;
}

// Utility: combine multiple recommendation signals into a final ranked list
function hybridRecommendations({ graph, userPurchaseIds = [], candidateLimit = 10 }) {
  // Signals: co-purchase score + popularity + category-similarity
  const candidateScores = new Map();
  const purchasedSet = new Set(userPurchaseIds);

  // Seed candidates: neighbors of purchased items + trending products
  for (const pid of userPurchaseIds) {
    for (const [nid, w] of graph.neighbors(pid).entries()) {
      if (purchasedSet.has(nid)) continue;
      candidateScores.set(nid, (candidateScores.get(nid) || 0) + w * 2); // co-purchase weight boosted
    }
  }

  // Add trending signals
  recommendTrending(5).forEach((p, idx) => {
    if (purchasedSet.has(p.id)) return;
    candidateScores.set(p.id, (candidateScores.get(p.id) || 0) + (5 - idx));
  });

  // Add category similarity: if candidate shares category with user's purchased products, add weight
  const userCategories = new Set(userPurchaseIds.map(id => products[id] && products[id].category).filter(Boolean));
  for (const pid of candidateScores.keys()) {
    const prod = products[pid];
    if (!prod) continue;
    if (userCategories.has(prod.category)) candidateScores.set(pid, candidateScores.get(pid) + 1);
    candidateScores.set(pid, candidateScores.get(pid) + Math.log(prod.popularity + 1) * 0.5);
  }

  // Build heap and return top candidates
  const heap = new Heap((a, b) => a.score > b.score);
  for (const [pid, s] of candidateScores.entries()) heap.insert({ id: pid, score: s, product: products[pid] });

  const out = [];
  let limit = candidateLimit;
  while (limit-- > 0 && !heap.isEmpty()) out.push(heap.extract());
  return out;
}

// ---------- Example: build graph from purchase sessions and demo ----------
const purchaseSessions = [
  [1, 5, 6],   // laptop, mouse, cable
  [2, 3, 6],   // phone, case, cable
  [2, 4, 6],   // phone, charger, cable
  [7, 6],      // headphones, cable
  [1, 7],      // laptop, headphones
  [2, 5],      // phone, mouse
  [3, 6],      // case, cable
  [4, 6],      // charger, cable
];

const productGraph = new ProductGraph();
productGraph.buildFromPurchaseHistory(purchaseSessions);

// Example users
const users = {
  alice: { id: 'alice', purchases: [2, 6] }, // phone, cable
  bob:   { id: 'bob', purchases: [1, 5] },   // laptop, mouse
};

// Demo outputs
console.log('=== Trending ===');
console.log(recommendTrending(3));
console.log('\n=== By Category for product 2 (Phone) ===');
console.log(recommendByCategory(2, 3));
console.log('\n=== Co-purchased with product 6 (USB-C Cable) ===');
console.log(recommendCoPurchased(productGraph, 6, 5));
console.log('\n=== Personalized for Alice ===');
console.log(personalizedRecommendations(productGraph, users.alice.purchases, 5));
console.log('\n=== Hybrid Recommendations for Bob ===');
console.log(hybridRecommendations({ graph: productGraph, userPurchaseIds: users.bob.purchases, candidateLimit: 5 }));

// Export for usage in other modules (Node/CommonJS)
module.exports = {
  products,
  addProduct,
  updateProduct,
  deleteProduct,
  searchProductByName,
  Heap,
  MaxHeapByPopularity,
  MinHeapByPrice,
  ProductGraph,
  recommendTrending,
  recommendByCategory,
  recommendCoPurchased,
  personalizedRecommendations,
  hybridRecommendations,
};
