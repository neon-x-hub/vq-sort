import { performance } from 'perf_hooks';
import { vqSort, calculateForgivingRecall } from '../src/vq-sort.js';
import { quickSort } from '../src/quick-sort.js';

// Setup benchmark configurations using the new accuracy factor
// We set accuracy factors that produce the target bucket counts:
// - N = 100,000 and accuracy = 0.006  => 600 buckets
// - N = 2,000,000 and accuracy = 0.0005 => 1000 buckets
// - N = 5,000,000 and accuracy = 0.0003 => 1500 buckets
const CONFIGS = [
  { n: 100_000, accuracy: 0.006 },
  { n: 2_000_000, accuracy: 0.0005 },
  { n: 5_000_000, accuracy: 0.0003 }
];

// Helper to format float arrays into display strings
function fmtSlice(slice) {
  return Array.from(slice).map(num => num.toFixed(2)).join(", ");
}

// Data generator helper
function generateDatasets(n) {
  // 1. Uniform Distribution (0 to 10,000)
  const uniform = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    uniform[i] = Math.random() * 10000;
  }

  // 2. Gaussian Distribution (Mean 5000, StdDev 1500)
  const gaussian = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    gaussian[i] = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * 1500 + 5000;
  }

  // 3. Exponential Distribution (Highly Skewed, lambda = 1/2000)
  const exponential = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    exponential[i] = -Math.log(1 - Math.random()) * 2000;
  }

  return { uniform, gaussian, exponential };
}

function runBenchmark() {
  console.log("====================================================================");
  console.log("             VQ-SORT AUTOMATED BENCHMARK SUITE                     ");
  console.log("====================================================================\n");

  const results = [];

  for (const config of CONFIGS) {
    const { n, accuracy } = config;
    const computedBuckets = Math.max(2, Math.floor(n * accuracy));
    const avgBucketSize = n / computedBuckets;

    console.log(`--------------------------------------------------------------------`);
    console.log(`CONFIG: N = ${n.toLocaleString()} | Accuracy = ${accuracy} (Computed Buckets = ${computedBuckets})`);
    console.log(`--------------------------------------------------------------------`);

    console.log("Generating datasets...");
    const datasets = generateDatasets(n);

    for (const [distName, dataset] of Object.entries(datasets)) {
      console.log(`\nTesting Profile: ${distName.toUpperCase()} Distribution`);

      // 1. Benchmark QuickSort (Copy dataset to avoid in-place pollution)
      const qsData = new Float64Array(dataset);
      const startQS = performance.now();
      const qsResult = quickSort(qsData);
      const endQS = performance.now();
      const qsTime = endQS - startQS;
      console.log(`  [QuickSort] Time : ${qsTime.toFixed(2)} ms`);

      // 2. Benchmark VQ-Sort
      const vqData = new Float64Array(dataset);
      const startVQ = performance.now();
      const vqResult = vqSort(vqData, accuracy);
      const endVQ = performance.now();
      const vqTime = endVQ - startVQ;
      console.log(`  [VQ-Sort]   Time : ${vqTime.toFixed(2)} ms`);

      const speedup = qsTime / vqTime;
      console.log(`  \x1b[32m[Speedup]   VQ-Sort is ${speedup.toFixed(2)}x faster\x1b[0m`);

      // 3. Calculate Recall Metrics
      const forgivenessLevels = [0.0, 0.1, 0.2, 0.5, 1.0];
      const recallData = {};
      forgivenessLevels.forEach(f => {
        const recall = calculateForgivingRecall(vqResult, f, avgBucketSize);
        recallData[f] = recall;
      });

      console.log("  [Recall Metrics]:");
      for (const [f, recall] of Object.entries(recallData)) {
        const span = Math.max(1, Math.floor(parseFloat(f) * avgBucketSize * 2));
        console.log(`    Forgiveness ${parseFloat(f).toFixed(1)} (Window: ${span} elements) -> Recall: ${recall.toFixed(2)}%`);
      }

      // Visual sample preview
      const mid = Math.floor(n / 2);
      console.log(`  [Samples]:`);
      console.log(`    Start: [ ${fmtSlice(vqResult.slice(0, 5))} ... ]`);
      console.log(`    Mid:   [ ${fmtSlice(vqResult.slice(mid, mid + 5))} ... ]`);
      console.log(`    End:   [ ${fmtSlice(vqResult.slice(n - 5, n))} ... ]`);

      results.push({
        n,
        accuracy,
        computedBuckets,
        distribution: distName,
        qsTime,
        vqTime,
        speedup,
        recall: recallData
      });
    }
    console.log();
  }

  // Print Summary Table
  console.log("\n====================================================================");
  console.log("                         SUMMARY REPORT                             ");
  console.log("====================================================================");
  console.log(
    String("Data Size").padEnd(12) + 
    String("Distribution").padEnd(15) + 
    String("Accuracy").padEnd(10) + 
    String("QuickSort (ms)").padEnd(16) + 
    String("VQ-Sort (ms)").padEnd(14) + 
    String("Speedup").padEnd(10) + 
    String("Recall (F=0.2)").padEnd(15) +
    String("Recall (F=0.5)")
  );
  console.log("-".repeat(105));

  for (const res of results) {
    const nStr = res.n >= 1_000_000 ? `${res.n / 1_000_000}M` : `${res.n / 1_000}k`;
    console.log(
      nStr.padEnd(12) +
      res.distribution.padEnd(15) +
      res.accuracy.toString().padEnd(10) +
      res.qsTime.toFixed(1).padEnd(16) +
      res.vqTime.toFixed(1).padEnd(14) +
      `${res.speedup.toFixed(2)}x`.padEnd(10) +
      `${res.recall[0.2].toFixed(1)}%`.padEnd(15) +
      `${res.recall[0.5].toFixed(1)}%`
    );
  }
  console.log("====================================================================\n");
}

runBenchmark();
