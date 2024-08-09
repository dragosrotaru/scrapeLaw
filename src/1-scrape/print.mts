export function printProgress(index: number, total: number, id: string) {
  const progress = index + 1;
  const percent = Math.round((progress / total) * 100);
  console.log(`Progress: ${progress} / ${total} (${percent}%) - ${id}`);
}
