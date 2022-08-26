import { ActionPanel, List, Action, environment, closeMainWindow, getPreferenceValues } from "@raycast/api";
import { exec } from "child_process";
import { useState, ReactElement } from "react";
import open from "open";
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

function search(text: string, setElements: any) {
  console.log(text);
  exec(["python3", script, preference.projectBasePath, preference.level, 40, text].join(" "), (err, stdout, stderr) => {
    const element = createElements(stdout);
    setElements(element);
  });
}

export default function Command() {
  const [elements, setElements] = useState([<List.Item id="loading" title={"loading..."} />]);
  if (!run) {
    search("", setElements);
    run = true;
  }

  return (
    <List
      onSearchTextChange={(text) => {
        search(
          text
            .split(" ")
            .filter((text) => !!text)
            .join(","),
          setElements
        );
      }}
      children={elements}
    />
  );
}

function createElements(content: string): ReactElement[] {
  const elements: ReactElement[] = [];
  content
    .split("\n")
    .filter((text) => !!text)
    .forEach((line) => {
      elements.push(createElement(line));
    });
  return elements;
}

function createElement(path: string): ReactElement {
  return (
    <List.Item
      id={path}
      title={path}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Open title="Open in Code" icon="command-icon.png" target={path} application={codeAppKey} />
            <Action.CopyToClipboard title="Copy to clipboard" content={path} />
            <Action.ShowInFinder title="Open in Finder" path={path} />
            <Action
              title="Open in Terminal"
              key="terminal"
              onAction={() => {
                open(path, { app: { name: terminalPath, arguments: [path] } });
                closeMainWindow();
              }}
              icon={{ fileIcon: terminalPath }}
              shortcut={{ modifiers: ["cmd"], key: "t" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
