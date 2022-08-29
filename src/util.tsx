import { List } from "@raycast/api";
import { ReactElement } from "react";
import { addSelected, getSeletected } from "./cache";

let baseDir = "";

export function getPath(path: string) {
  return baseDir + "/" + path;
}

export function parseContent(content: string): string[] {
  return content.split("\n").filter((text) => !!text);
}

export function createElements(content: string[], createor: any, recent: boolean): ReactElement[] {
  return content.map((item) => createor(item, recent));
}

export function queryProcess(text: string): string {
  return text
    .split(" ")
    .filter((text) => !!text)
    .join(",");
}

export function realSearch(cacheKey: string, text: string, setElements: any, creator: any, exec: any) {
  const selected = getSeletected(cacheKey, text);
  const element = createElements(selected, creator, true);
  if (selected.length > 5 && text == "") {
    setElements(element);
    return;
  }
  element.push(<List.Item key="loading" title={"loading..."} />);
  setElements(element);
  exec((content: string) => {
    let res = parseContent(content);
    baseDir = res[0];
    res = res.slice(1);
    const filtered = filterRes(selected, res);
    let element = createElements(selected, creator, true);
    element = element.concat(createElements(filtered, creator, false));
    setElements(element);
  });
}

export function filterRes(list: string[], newList: string[]): string[] {
  const s = new Set(list);
  return newList.filter((item) => !s.has(item));
}

export function choose(cacheKey: string): (arg: string | number) => void {
  return (arg: string | number) => {
    addSelected(cacheKey, String(arg));
  };
}
