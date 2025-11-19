export function groupBy<T, Q>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => Q,
): Map<Q, T[]> {
  return array.reduce((map, value, index, array) => {
    const key = predicate(value, index, array)
    const list = map.get(key)
    if (list == null) {
      map.set(key, [value])
    } else {
      list.push(value)
    }
    return map
  }, new Map<Q, T[]>())
}
