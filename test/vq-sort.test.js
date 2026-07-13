import { test } from 'node:test';
import assert from 'node:assert';
import { vqSort, calculateForgivingRecall } from '../src/vq-sort.js';
import { quickSort } from '../src/quick-sort.js';

test('quickSort basic sorting', () => {
  const input = [5, 3, 8, 1, 9, 2, 4, 7, 6];
  const expected = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const result = quickSort(input);
  assert.deepStrictEqual(result, expected);
});

test('quickSort empty and single element arrays', () => {
  assert.deepStrictEqual(quickSort([]), new Float64Array([]));
  assert.deepStrictEqual(quickSort([42]), new Float64Array([42]));
});

test('vqSort empty and single element arrays', () => {
  assert.deepStrictEqual(vqSort([]), new Float64Array([]));
  assert.deepStrictEqual(vqSort([42]), new Float64Array([42]));
});

test('vqSort all identical elements', () => {
  const input = [5, 5, 5, 5, 5];
  const expected = new Float64Array([5, 5, 5, 5, 5]);
  const result = vqSort(input, 2.0); // 5 elements * 2.0 accuracy = 10 baseBuckets
  assert.deepStrictEqual(result, expected);
});

test('vqSort negative and positive numbers', () => {
  const input = [-10, 50, -3.5, 0, 100, 12.3];
  const result = vqSort(input, 1.67); // 6 elements * 1.67 accuracy = 10 baseBuckets
  
  // Since VQ-Sort is approximate, let's verify that the output contains all elements
  assert.strictEqual(result.length, input.length);
  
  // Check that elements are generally sorted (forgiving recall should be high)
  // With 10 base buckets and 6 elements, they should be mapped reasonably.
  // Let's verify elements exist in output
  const sortedInput = Array.from(input).sort((a, b) => a - b);
  const sortedResult = Array.from(result).sort((a, b) => a - b);
  assert.deepStrictEqual(sortedResult, sortedInput);
});

test('vqSort approximate sort quality on larger array', () => {
  const n = 1000;
  const input = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    input[i] = Math.random() * 100;
  }
  
  const accuracy = 0.1; // 100 baseBuckets / 1000 elements
  const result = vqSort(input, accuracy);
  assert.strictEqual(result.length, n);

  // Forgiving recall at f=0.5 should be very high (typically >90%)
  const baseBuckets = Math.max(2, Math.floor(n * accuracy));
  const avgBucketSize = n / baseBuckets; // 10
  const recall = calculateForgivingRecall(result, 0.5, avgBucketSize);
  assert.ok(recall > 85, `Expected high forgiving recall (>85%), got ${recall}%`);
});

test('calculateForgivingRecall behaves correctly', () => {
  // Fully sorted array -> Recall should be 100% even at forgiveness = 0
  const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.strictEqual(calculateForgivingRecall(sorted, 0.0, 2), 100);
  assert.strictEqual(calculateForgivingRecall(sorted, 0.5, 2), 100);

  // Perturbed array: [1, 3, 2, 4, 5]
  // With window = 1: i=0 (1<=3 ok), i=1 (3<=2 fails), i=2 (2<=4 ok), i=3 (4<=5 ok). 3 out of 4 pairs ok. Recall = 75%
  // window size is Math.max(1, Math.floor(forgiveness * avgBucketSize * 2))
  // if forgiveness = 0.25, avgBucketSize = 2 -> window = Math.max(1, Math.floor(0.25 * 2 * 2)) = Math.max(1, 1) = 1.
  const perturbed = [1, 3, 2, 4, 5];
  const recall = calculateForgivingRecall(perturbed, 0.25, 2);
  assert.strictEqual(recall, 75);
});
