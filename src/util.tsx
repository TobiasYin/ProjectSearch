import { Action, ActionPanel, List } from "@raycast/api";
import { useState, ReactElement } from "react";
import { addSelected, clearSelection, deleteSeletected, geStorePath, getSeletected, setPath } from "./cache";

let baseDir = "";
let setSelected: any = null;
let nowSelected: string | null | undefined = null;
let curText = "";
let setElement: any = null;
let run = false;
let cacheKey = "";
let search: any = null;

export function init(c: string, s: any) {
  cacheKey = c;
  baseDir = geStorePath(c);
  search = s;
}

function keepSelected(func: () => void) {
  const s = nowSelected;
  func();
  setSelected(s);
}

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

export function realSearch(text: string, creator: any, exec: any) {
  let selected = getSeletected(cacheKey, text);
  const element = createElements(selected, creator, true);
  if (selected.length > 5 && text == "") {
    keepSelected(() => {
      setElement(element);
    });
    return;
  }
  element.push(<List.Item key="loading" title={"loading..."} />);
  keepSelected(() => {
    setElement(element);
  });
  exec((content: string) => {
    let res = parseContent(content);
    baseDir = res[0];
    if (baseDir != geStorePath(cacheKey)) {
      clearSelection(cacheKey);
      selected = [];
      setPath(cacheKey, baseDir);
    }
    res = res.slice(1);
    const filtered = filterRes(selected, res);
    let element = createElements(selected, creator, true);
    element = element.concat(createElements(filtered, creator, false));
    setElement(element);
  });
}

export function filterRes(list: string[], newList: string[]): string[] {
  const s = new Set(list);
  return newList.filter((item) => !s.has(item));
}

export function getSetter(): any {
  return setElement;
}

export function GenCommand() {
  const [elements, setElements] = useState([<List.Item key="loading" title={"loading..."} />]);
  const [selectId, setSelectID] = useState("");

  setElement = setElements;
  setSelected = setSelectID;

  if (!run) {
    search("", setElements);
    run = true;
  }

  return (
    <List
      onSelectionChange={(id) => {
        nowSelected = id;
      }}
      onSearchTextChange={(text) => {
        curText = text;
        search(text, setElements);
      }}
      selectedItemId={selectId}
      children={elements}
    />
  );
}

export function CopyToClipboard(path: string): ReactElement {
  return (
    <Action.CopyToClipboard
      title="Copy to clipboard"
      content={getPath(path)}
      onCopy={() => {
        addSelected(cacheKey, path);
      }}
    />
  );
}

export function DeleteInCache(path: string): ReactElement {
  return (
    <ActionPanel.Section>
      <Action
        title="Delete In Cache"
        key="delete"
        onAction={() => {
          deleteSeletected(cacheKey, path);
          search(curText);
        }}
        shortcut={{ modifiers: ["cmd"], key: "d" }}
      />
    </ActionPanel.Section>
  );
}
