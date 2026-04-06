/**
 * Computes available jersey numbers (within [min, max] minus taken),
 * collapses consecutive numbers into ranges, and returns a display string.
 *
 * Example: taken=[2,4,5,6], min=1, max=10
 *   available: [1,3,7,8,9,10]
 *   output: "1, 3, 7-10"
 */
export function formatAvailableRanges(
  taken: number[],
  min = 1,
  max = 99,
): string {
  const takenSet = new Set(taken);
  const available: number[] = [];
  for (let n = min; n <= max; n++) {
    if (!takenSet.has(n)) {
      available.push(n);
    }
  }

  if (available.length === 0) return "";

  const parts: string[] = [];
  let rangeStart = available[0]!;
  let prev = available[0]!;

  for (let i = 1; i < available.length; i++) {
    const curr = available[i]!;
    if (curr === prev + 1) {
      prev = curr;
    } else {
      parts.push(
        prev === rangeStart ? `${rangeStart}` : `${rangeStart}-${prev}`,
      );
      rangeStart = curr;
      prev = curr;
    }
  }
  parts.push(prev === rangeStart ? `${rangeStart}` : `${rangeStart}-${prev}`);

  return parts.join(", ");
}
