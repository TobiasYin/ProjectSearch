import { ActionPanel, List, Action, environment, closeMainWindow, getPreferenceValues } from "@raycast/api";
import { exec } from "child_process";
import { useState, ReactElement } from "react";
import open from "open";
import { addSelected, deleteSeletected } from "./cache";
import { choose, queryProcess, realSearch } from "./util";
interface Preference {
  level?: number;
  remoteURI: string;
  projectBasePath: string;
}

const terminalPath = "/Applications/iTerm.app";
const preference: Preference = getPreferenceValues();

const path = environment.assetsPath;
const script = path + "/lsall.py";
const remoteScript = "/tmp/lsall.py";
const cacheKey = "remote";
let curText = "";
let setElement: any = null;
let run = false;

function search(text: string, setElements: any) {
  text = queryProcess(text);
  realSearch(cacheKey, text, setElements, createElement, (reshandler: (arg0: string) => void) => {
    let path = preference.projectBasePath;
    path = path.replace("$", "\\$");
    const cmd = ["ssh", preference.remoteURI, "python3", remoteScript, path, preference.level, 20, text].join(" ");

    exec(cmd, (err, stdout, stderr) => {
      if (err != null) {
        if (err.code == 2) {
          sendScriptAndRetry(text, setElements);
        } else {
          setElements([createMessage(err.message)]);
        }
        return;
      }
      reshandler(stdout);
    });
  });
}

function createMessage(message: string): ReactElement {
  return <List.Item title={message} />;
}

function sendScriptAndRetry(text: string, setElements: any) {
  setElements([createMessage("Waiting, the script not installed in remote, Installing...")]);
  exec(["scp", script, preference.remoteURI + ":" + remoteScript].join(" "), (err, stdout, stderr) => {
    if (err != null) {
      setElements([createMessage(err.message)]);
      return;
    }
    search(text, setElements);
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
        search(text, setElements);
        curText = text;
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
            <Action
              title={`Open in Code (Remote)`}
              icon="command-icon.png"
              onAction={() => {
                addSelected(cacheKey, path);
                exec("code --remote ssh-remote+" + preference.remoteURI + " " + path);
                closeMainWindow();
              }}
            />
            <Action.CopyToClipboard title="Copy to clipboard" content={path} onCopy={choose(cacheKey)} />
            <Action
              title="Open in Terminal"
              key="terminal"
              onAction={() => {
                addSelected(cacheKey, path);
                open("ssh://" + preference.remoteURI, { app: { name: terminalPath } });
                exec(
                  `osascript -e 'tell application "iTerm" to tell current session of current window to write text "cd ${path}"'`
                );
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
