import { Cache } from "@raycast/api";

const cache = new Cache();

const cacheSize = 20;

export function addSelected(key: string, selected: string) {
  const list = getSeletected(key, "");
  const newList: string[] = [selected];
  for (const item of list) {
    if (list.length > cacheSize) {
      break;
    }
    if (item != selected) {
      newList.push(item);
    }
  }
  cache.set(key, JSON.stringify(newList));
  return;
}

export function getSeletected(key: string, query: string): string[] {
  const querys = query.split(",");
  const list: string[] = JSON.parse(cache.get(key) || "[]");
  return list.filter((item) => {
    let all = true;
    for (const q of querys) {
      if (!item.includes(q)) {
        all = false;
        break;
      }
    }
    return all;
  });
}
