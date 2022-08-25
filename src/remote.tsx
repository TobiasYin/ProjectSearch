import { ActionPanel, List, Action, environment, closeMainWindow, getPreferenceValues } from "@raycast/api";
import { exec } from "child_process";
import { useState, ReactElement } from "react";
import open from "open";
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

let run = false;

function search(text: string, setElements: any) {
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
    const element = createElements(stdout);
    setElements(element);
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
            <Action
              title={`Open in Code (Remote)`}
              icon="command-icon.png"
              onAction={() => {
                exec("code --remote ssh-remote+" + preference.remoteURI + " " + path);
                closeMainWindow();
              }}
            />
            <Action.CopyToClipboard title="Copy to clipboard" content={path} />
            <Action
              title="Open in Terminal"
              key="terminal"
              onAction={() => {
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
        </ActionPanel>
      }
    />
  );
}
