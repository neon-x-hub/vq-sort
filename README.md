# VQ-Sort (Velocity Quantize Sort)

An ultra-fast, approximate sorting algorithm for JavaScript based on statistical centroid quantization.

[![npm version](https://img.shields.io/npm/v/vq-sort.svg)](https://www.npmjs.com/package/vq-sort)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is VQ-Sort?

**VQ-Sort** is an $O(N)$ approximate sorting algorithm designed for scenarios where extreme speed is required and a small amount of local ordering error is acceptable. It is particularly effective for:
- **Level of Detail (LOD) sorting** in 3D rendering and game engines.
- **Particle system depth-sorting** where exact Z-sorting is not necessary.
- **Rough statistical partition/percentile estimation** on massive datasets.
- **Pre-sorting** or bucketing steps in larger data pipeline architectures.

### How it Works

Instead of comparing elements, VQ-Sort applies a statistical quantization process:
1. **Statistical Calibration ($O(1)$ sampling):** It samples a constant number of elements (1000 items) to estimate the mean ($\mu$) and standard deviation ($\sigma$) of the dataset.
2. **Robust Range Clamping ($O(1)$ bounds):** It clamps the statistical range at $\mu \pm 3\sigma$. Elements outside these bounds (outliers) are cleanly clustered into the outer head/tail buckets, preventing outliers from stretching the bucket ranges and crushing the resolution.
3. **Statistical Direct Mapping ($O(N)$):** Using a fast, division-free bucket assignment formula, elements are distributed directly into $B$ destination buckets where $B = \text{Math.max}(2, \text{Math.floor}(N \times \text{accuracy}))$.
4. **Raw Flattening ($O(N)$):** The buckets are flattened into a new `Float64Array`. Since elements inside a bucket are not sorted individually, this is an approximate sort.

---

## Performance Benchmark

Below is the performance comparison between **VQ-Sort** and a custom **in-place QuickSort** implementation using dynamic bucket densities.

### Benchmark Results
Run on Node.js v24.12.0:

| Data Size ($N$) | Distribution | Accuracy | QuickSort (ms) | VQ-Sort (ms) | Speedup | Recall ($F=0.2$) | Recall ($F=0.5$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **100k** | Uniform | 0.006 | 13.4 ms | 6.7 ms | **2.01x** | 85.2% | 100.0% |
| **100k** | Gaussian | 0.006 | 11.4 ms | 4.4 ms | **2.58x** | 85.2% | 100.0% |
| **100k** | Exponential | 0.006 | 9.8 ms | 3.2 ms | **3.02x** | 74.4% | 90.8% |
| **2M** | Uniform | 0.0005 | 243.9 ms | 70.9 ms | **3.44x** | 84.6% | 100.0% |
| **2M** | Gaussian | 0.0005 | 248.2 ms | 78.6 ms | **3.16x** | 84.9% | 100.0% |
| **2M** | Exponential | 0.0005 | 241.7 ms | 58.3 ms | **4.15x** | 74.9% | 91.1% |
| **5M** | Uniform | 0.0003 | 638.8 ms | 146.3 ms | **4.37x** | 83.9% | 100.0% |
| **5M** | Gaussian | 0.0003 | 654.2 ms | 147.7 ms | **4.43x** | 84.9% | 100.0% |
| **5M** | Exponential | 0.0003 | 661.2 ms | 138.6 ms | **4.77x** | 75.3% | 91.5% |

> [!NOTE]
> **Recall ($F$)** refers to the Forgiveness-based Recall metric. A recall of $100\%$ at $F=0.5$ means that every element in the output array is smaller than or equal to the element situated half-a-bucket width ahead. For Uniform/Gaussian shapes, VQ-Sort achieves near-perfect order macro-alignment.

---

## Installation

Install via npm:

```bash
npm install vq-sort
```

---

## Usage

### Import in ES Modules

```javascript
import { vqSort, calculateForgivingRecall } from 'vq-sort';

const data = new Float64Array([10.5, 2.1, 8.4, 5.0, 1.2, 9.9, 3.3]);

// Approximately sort with an accuracy factor of 0.1 (density of 1 bucket per 10 elements)
const sorted = vqSort(data, 0.1);
console.log(sorted);
// Output: Float64Array(7) [ 1.2, 2.1, 3.3, 5, 8.4, 9.9, 10.5 ]
```

### JSDoc API Reference

#### `vqSort(arr, accuracy = 0.001)`

Approximately sorts an array of numbers using statistical centroid quantization.

- **`arr`** (`ArrayLike<number>`): The array of numbers to approximately sort.
- **`accuracy`** (`number`): The accuracy factor representing the bucket density relative to the array size. For example, `0.001` means 1 bucket per 1000 elements. Higher accuracy increases sorting quality but may reduce speed for very large arrays.
- **Returns** (`Float64Array`): A new Float64Array containing the approximately sorted elements.

#### `calculateForgivingRecall(arr, forgiveness, avgBucketSize)`

Calculates the forgiveness-based recall metric of an approximately sorted array.

- **`arr`** (`ArrayLike<number>`): The sorted array to evaluate.
- **`forgiveness`** (`number`): The forgiveness multiplier (fraction of `avgBucketSize`). Typical values are `0.1` to `1.0`.
- **`avgBucketSize`** (`number`): The average size of a bucket ($N / \text{computedBuckets}$).
- **Returns** (`number`): The recall percentage ($0$ to $100$).

---

## Running Benchmarks and Tests

To contribute to or benchmark VQ-Sort locally:

1. Clone the repository and install dev dependencies:
   ```bash
   git clone https://github.com/neon-x-hub/vq-sort.git
   cd vq-sort
   npm install
   ```

2. Run the unit tests:
   ```bash
   npm test
   ```

3. Run the automated benchmark suite:
   ```bash
   npm run benchmark
   ```

## License

MIT License. See [LICENSE](LICENSE) for details.
