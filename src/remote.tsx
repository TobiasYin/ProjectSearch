import { ActionPanel, List, Action, environment, closeMainWindow, getPreferenceValues } from "@raycast/api";
import { exec } from "child_process";
import { ReactElement } from "react";
import open from "open";
import { addSelected } from "./cache";
import { CopyToClipboard, DeleteInCache, GenCommand, getPath, getSetter, init, queryProcess, realSearch } from "./util";
interface Preference {
  level?: number;
  remoteURI: string;
  projectBasePath: string;
  showFullPath: boolean;
}

const terminalPath = "/Applications/iTerm.app";
const preference: Preference = getPreferenceValues();

const path = environment.assetsPath;
const script = path + "/lsall.py";
const remoteScript = "/tmp/lsall.py";
const cacheKey = "remote";

function search(text: string) {
  text = queryProcess(text);
  realSearch(text, createElement, (reshandler: (arg0: string) => void) => {
    let path = preference.projectBasePath;
    path = path.replace("$", "\\$");
    const cmd = ["ssh", preference.remoteURI, "python3", remoteScript, path, preference.level, 20, text].join(" ");

    exec(cmd, (err, stdout, stderr) => {
      if (err != null) {
        if (err.code == 2) {
          sendScriptAndRetry(text);
        } else {
          getSetter()([createMessage(err.message)]);
        }
        return;
      }
      reshandler(stdout);
    });
  });
}
init(cacheKey, search);

function createMessage(message: string): ReactElement {
  return <List.Item key="message" title={message} />;
}

function sendScriptAndRetry(text: string) {
  getSetter()([createMessage("Waiting, the script not installed in remote, Installing...")]);
  exec(["scp", script, preference.remoteURI + ":" + remoteScript].join(" "), (err, stdout, stderr) => {
    if (err != null) {
      getSetter()([createMessage(err.message)]);
      return;
    }
    search(text);
  });
}

export default function Command() {
  return GenCommand();
}

function createElement(path: string, recentOpen: boolean): ReactElement {
  const realPath = getPath(path);
  const showPath = preference.showFullPath ? realPath : path;
  return (
    <List.Item
      key={realPath}
      id={realPath}
      title={showPath}
      subtitle={recentOpen ? "recent" : ""}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action
              title={`Open in Code (Remote)`}
              icon="command-icon.png"
              onAction={() => {
                addSelected(cacheKey, path);
                exec("code --remote ssh-remote+" + preference.remoteURI + " " + realPath);
                closeMainWindow();
              }}
            />
            {CopyToClipboard(path)}
            <Action
              title="Open in Terminal"
              key="terminal"
              onAction={() => {
                addSelected(cacheKey, path);
                open("ssh://" + preference.remoteURI, { app: { name: terminalPath } });
                exec(
                  `osascript -e 'tell application "iTerm" to tell current session of current window to write text "cd ${realPath}"'`
                );
                closeMainWindow();
              }}
              icon={{ fileIcon: terminalPath }}
              shortcut={{ modifiers: ["cmd"], key: "t" }}
            />
          </ActionPanel.Section>
          {DeleteInCache(path)}
        </ActionPanel>
      }
    />
  );
}
