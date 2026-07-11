/**
 * Sorts an array of numbers using a custom in-place QuickSort implementation.
 * 
 * This is used as the baseline comparison algorithm for VQ-Sort performance analysis.
 * It copies the input array to a Float64Array and performs a standard QuickSort.
 *
 * @param {ArrayLike<number>} arr - The array of numbers to sort.
 * @returns {Float64Array} A new Float64Array containing the sorted elements.
 */
export function quickSort(arr) {
  const a = new Float64Array(arr);
  const n = a.length;
  if (n <= 1) {
    return a;
  }

  /**
   * Recursive helper running the in-place partitioning and sorting.
   * 
   * @param {number} left - The left boundary index.
   * @param {number} right - The right boundary index.
   */
  function run(left, right) {
    if (left >= right) {
      return;
    }
    const pivot = a[Math.floor((left + right) / 2)];
    let i = left;
    let j = right;
    while (i <= j) {
      while (a[i] < pivot) {
        i++;
      }
      while (a[j] > pivot) {
        j--;
      }
      if (i <= j) {
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
        i++;
        j--;
      }
    }
    run(left, j);
    run(i, right);
  }

  run(0, n - 1);
  return a;
}
