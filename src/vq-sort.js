/**
 * Approximately sorts an array of numbers using statistical centroid quantization.
 * 
 * VQ-Sort (Velocity Quantize Sort) is an O(N) approximate sorting algorithm that achieves 
 * extreme speeds by sacrificing absolute precision. It uses statistical calibration to map
 * elements directly to destination buckets in O(1) time, then flattens the buckets.
 *
 * @param {ArrayLike<number>} arr - The array of numbers to approximately sort.
 * @param {number} [baseBuckets=1000] - The baseline bucket resolution. Higher values increase accuracy but may slightly reduce speed.
 * @returns {Float64Array} A new Float64Array containing the approximately sorted elements.
 */
export function vqSort(arr, baseBuckets = 1000) {
  const n = arr.length;
  if (n <= 1) {
    return new Float64Array(arr);
  }

  // Phase 1: Statistical Calibration (Sample Mean & Variance)
  const sampleSize = 1000;
  const sampleStep = Math.max(1, Math.floor(n / sampleSize));

  let sum = 0;
  let sampleCount = 0;
  for (let i = 0; i < n; i += sampleStep) {
    sum += arr[i];
    sampleCount++;
  }
  const mean = sum / sampleCount;

  let varianceSum = 0;
  for (let i = 0; i < n; i += sampleStep) {
    const diff = arr[i] - mean;
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / sampleCount);

  // Establish a robust statistical range (Clamping at +/- 3 Standard Deviations)
  const statMin = mean - 3 * stdDev;
  const statMax = mean + 3 * stdDev;
  const statRange = statMax - statMin;

  const virtualBuckets = baseBuckets * 3;
  // If statRange is 0 (all sample elements are identical), set tau to a fallback value to avoid division by zero
  const tau = statRange === 0 ? 1 : statRange / (virtualBuckets - 2); // Leave 2 buckets for outer tails

  const buckets = new Array(virtualBuckets);
  for (let i = 0; i < virtualBuckets; i++) {
    buckets[i] = [];
  }

  // Phase 2: Statistical Direct Mapping
  for (let i = 0; i < n; i++) {
    const val = arr[i];

    // Fast O(1) statistical bucket assignment
    let bIdx = Math.floor((val - statMin) / tau) + 1;

    // Outliers outside 3 standard deviations are clamped cleanly into head/tail buckets
    if (bIdx >= virtualBuckets) {
      bIdx = virtualBuckets - 1;
    } else if (bIdx < 0) {
      bIdx = 0;
    }

    buckets[bIdx].push(val);
  }

  // Phase 3: Raw Flattening
  const result = new Float64Array(n);
  let cursor = 0;
  for (let i = 0; i < virtualBuckets; i++) {
    const bucket = buckets[i];
    const len = bucket.length;
    for (let j = 0; j < len; j++) {
      result[cursor++] = bucket[j];
    }
  }
  return result;
}

/**
 * Calculates the forgiveness-based recall metric of an approximately sorted array.
 * 
 * Forgiveness-based recall measures the percentage of elements that are in the correct
 * relative order when allowing for a small local window of error (forgiveness).
 *
 * @param {ArrayLike<number>} arr - The approximately sorted array to evaluate.
 * @param {number} forgiveness - The forgiveness multiplier (fraction of avgBucketSize).
 * @param {number} avgBucketSize - The average size of a bucket (N / baseBuckets).
 * @returns {number} The forgiveness recall percentage (0 to 100).
 */
export function calculateForgivingRecall(arr, forgiveness, avgBucketSize) {
  const n = arr.length;
  if (n <= 1) {
    return 100;
  }
  const window = Math.max(1, Math.floor(forgiveness * avgBucketSize * 2));

  if (n <= window) {
    // If the array is smaller than the window, check if it's generally sorted
    let correctlyOrdered = 0;
    for (let i = 0; i < n - 1; i++) {
      if (arr[i] <= arr[i + 1]) {
        correctlyOrdered++;
      }
    }
    return (correctlyOrdered / (n - 1)) * 100;
  }

  let correctlyOrdered = 0;
  for (let i = 0; i < n - window; i++) {
    if (arr[i] <= arr[i + window]) {
      correctlyOrdered++;
    }
  }
  return (correctlyOrdered / (n - window)) * 100;
}
