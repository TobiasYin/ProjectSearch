import { List } from "@raycast/api";
import { ReactElement } from "react";
import { addSelected, getSeletected } from "./cache";

export function parseContent(content: string): string[] {
  return content.split("\n").filter((text) => !!text);
}

export function createElements(content: string[], createor: any): ReactElement[] {
  return content.map(createor);
}
export function queryProcess(text: string): string {
  return text
    .split(" ")
    .filter((text) => !!text)
    .join(",");
}
export function realSearch(cacheKey: string, text: string, setElements: any, creator: any, exec: any) {
  const selected = getSeletected(cacheKey, text);
  const element = createElements(selected, creator);
  if (selected.length > 5 && text == "") {
    setElements(element);
    return;
  }
  element.push(<List.Item key="loading" title={"loading..."} />);
  setElements(element);
  exec((content: string) => {
    const res = parseContent(content);
    const merged = mergeList(selected, res);
    const element = createElements(merged, creator);
    setElements(element);
  });
}

export function mergeList(list: string[], newList: string[]): string[] {
  const s = new Set(list);
  newList.forEach((item) => {
    if (!s.has(item)) {
      list.push(item);
    }
  });
  return list;
}

export function choose(cacheKey: string): (arg: string | number) => void {
  return (arg: string | number) => {
    addSelected(cacheKey, String(arg));
  };
}
