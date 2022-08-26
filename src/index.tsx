import { ActionPanel, List, Action, environment, closeMainWindow, getPreferenceValues } from "@raycast/api";
import { exec } from "child_process";
import { useState, ReactElement } from "react";
import open from "open";
import { addSelected, deleteSeletected } from "./cache";
import { choose, realSearch } from "./util";
interface Preference {
  projectBasePath: string;
  level: number;
}

const codeAppKey = "com.microsoft.VSCode";
const terminalPath = "/Applications/iTerm.app";
const preference: Preference = getPreferenceValues();
let run = false;
const path = environment.assetsPath;
const script = path + "/lsall.py";
const cacheKey = "local";
let curText = "";
let setElement: any = null;

function search(text: string, setElements: any) {
  realSearch(cacheKey, text, setElements, createElement, (reshandler: (arg0: string) => void) => {
    exec(
      ["python3", script, preference.projectBasePath, preference.level, 40, text].join(" "),
      (err, stdout, stderr) => {
        reshandler(stdout);
      }
    );
  });
}

export default function Command() {
  const [elements, setElements] = useState([<List.Item id="loading" title={"loading..."} />]);
  if (!run) {
    search("", setElements);
    run = true;
  }

  setElement = setElements;

  return (
    <List
      onSearchTextChange={(text) => {
        curText = text;
        search(text, setElements);
      }}
      children={elements}
    />
  );
}

function createElement(path: string): ReactElement {
  return (
    <List.Item
      id={path}
      title={path}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Open
              title="Open in Code"
              icon="command-icon.png"
              target={path}
              application={codeAppKey}
              onOpen={choose(cacheKey)}
            />
            <Action.CopyToClipboard title="Copy to clipboard" content={path} onCopy={choose(cacheKey)} />
            <Action.ShowInFinder
              title="Open in Finder"
              path={path}
              onShow={() => {
                choose(cacheKey)(path);
              }}
            />
            <Action
              title="Open in Terminal"
              key="terminal"
              onAction={() => {
                addSelected(cacheKey, path);
                open(path, { app: { name: terminalPath, arguments: [path] } });
                closeMainWindow();
              }}
              icon={{ fileIcon: terminalPath }}
              shortcut={{ modifiers: ["cmd"], key: "t" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Delete In Cache"
              key="delete"
              onAction={() => {
                deleteSeletected(cacheKey, path);
                search(curText, setElement);
              }}
              shortcut={{ modifiers: ["cmd"], key: "d" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
