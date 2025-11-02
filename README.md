# Smart Product Recommendation System

This README explains the structure, algorithms, and computational complexities of the **Smart Product Recommendation System**, which uses data structures like dictionaries, heaps, and graphs to produce intelligent product recommendations.

---

## 📘 Overview

The system provides multiple types of recommendations:

1. **Trending Recommendations** – Suggests most popular products using a max-heap.
2. **Category-Based Recommendations** – Suggests products similar in category to a target item.
3. **Co-Purchase Recommendations** – Suggests items frequently bought together using a weighted product graph.
4. **Personalized Recommendations** – Suggests products based on a user’s purchase history and product co-purchase relationships.
5. **Hybrid Recommendations** – Combines multiple signals (co-purchase, popularity, category similarity).

---

## ⚙️ Data Structures Used

| Structure                     | Purpose                                                            | Operations                 | Complexity                    |
| ----------------------------- | ------------------------------------------------------------------ | -------------------------- | ----------------------------- |
| **Dictionary (Object / Map)** | Stores product data for O(1) access by ID.                         | Lookup, Insert, Delete     | **O(1)** average              |
| **Heap (Binary Heap)**        | Efficient top-N product retrieval by popularity, score, or weight. | Insert, Extract-Max/Min    | **O(log n)** per op           |
| **Graph (Adjacency Map)**     | Models co-purchase relationships between products with weights.    | Add Edge, Lookup Neighbors | **O(1)** per edge (amortized) |

---

## 🧮 Algorithmic Complexity Analysis

### 1. Trending Recommendations

**Function:** `recommendTrending(n)`

* **Approach:** Insert all products into a max-heap by popularity.
* **Time Complexity:** O(m log m) where *m* = number of products.
* **Space Complexity:** O(m)
* **Trade-off:** Simple but not incremental—rebuilds heap each call. Good for small-to-mid product catalogs.

### 2. Category-Based Recommendations

**Function:** `recommendByCategory(productId, n)`

* **Approach:** Filter products by category, then use heap for top-N selection.
* **Time Complexity:** O(m log k), where *m* = total products and *k* = category size.
* **Space Complexity:** O(k)
* **Trade-off:** Category search is linear but acceptable for small categories. Caching could optimize frequent queries.

### 3. Co-Purchase Recommendations

**Function:** `recommendCoPurchased(graph, productId, n)`

* **Approach:** Sort or heapify by edge weight (co-purchase frequency).
* **Time Complexity:** O(d log d) where *d* = degree (number of neighbors) of product.
* **Space Complexity:** O(d)
* **Trade-off:** Highly efficient for sparse graphs; performance depends on graph density.

### 4. Personalized Recommendations

**Function:** `personalizedRecommendations(graph, userPurchaseIds, n)`

* **Approach:** Aggregate co-purchase scores across user’s purchased products, weight by popularity.
* **Time Complexity:** O(U × D log D), where *U* = number of user’s purchased items, *D* = average degree per item.
* **Space Complexity:** O(D)
* **Trade-off:** Balances accuracy with simplicity. Does not consider advanced factors like time decay or user similarity.

### 5. Hybrid Recommendations

**Function:** `hybridRecommendations({ graph, userPurchaseIds, candidateLimit })`

* **Approach:** Combines co-purchase, category, and trending scores using weighted sums.
* **Time Complexity:** O(C log C), where *C* = number of candidate products (typically small subset of all products).
* **Space Complexity:** O(C)
* **Trade-off:** Best overall balance between personalization and performance. Relies on graph and popularity freshness.

---

## ⚖️ Trade-offs and Design Considerations

| Area                    | Choice                                          | Trade-off                                             |
| ----------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| **Heap vs Sorting**     | Heap allows faster incremental top-N retrieval. | Slight overhead vs. full sort for small N.            |
| **Adjacency Map Graph** | Efficient for sparse co-purchase relations.     | Memory-heavy if graph becomes dense.                  |
| **Dictionary Storage**  | Fast lookup by ID.                              | Memory footprint grows linearly with catalog size.    |
| **Hybrid Scoring**      | Flexible integration of multiple signals.       | Requires careful tuning of weights for best accuracy. |

---

## 🧩 Example Data Flow

1. **Build Graph:** From historical purchase sessions.
2. **Store Products:** In dictionary keyed by ID.
3. **Run Algorithms:**

   * Use heaps to find top-N items.
   * Traverse graph to compute co-purchase relations.
4. **Output Recommendations:** Ranked arrays of product objects.

---

## 📊 Summary of Complexities

| Function                      | Time Complexity | Space Complexity | Notes                  |
| ----------------------------- | --------------- | ---------------- | ---------------------- |
| `recommendTrending`           | O(m log m)      | O(m)             | Uses MaxHeap           |
| `recommendByCategory`         | O(m log k)      | O(k)             | Filter + Heap          |
| `recommendCoPurchased`        | O(d log d)      | O(d)             | Weighted neighbor scan |
| `personalizedRecommendations` | O(U × D log D)  | O(D)             | Multi-item aggregation |
| `hybridRecommendations`       | O(C log C)      | O(C)             | Multi-signal merge     |

---

## 🚀 Future Improvements

* Use **MinHeap of size N** for optimized top-N selection (reduces heap size to N).
* Add **time-decay weighting** to emphasize recent purchases.
* Support **user-based collaborative filtering** using similarity scores.
* Persist graph to disk using JSON or database for scalability.

---

## 🧠 Summary

This system leverages efficient data structures (hash maps, heaps, graphs) to enable scalable, modular recommendation generation. Its design favors simplicity, interpretability, and adaptability, suitable for both e-commerce prototypes and production-scale applications.
This system leverages efficient data structures (hash maps, heaps, graphs) to enable scalable, modular recommendation generation. Its design favors simplicity, interpretability, and adaptability, suitable for both e-commerce prototypes and production-scale applications.
