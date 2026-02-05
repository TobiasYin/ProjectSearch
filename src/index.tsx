import { ActionPanel, List, Action, environment, closeMainWindow, getPreferenceValues } from "@raycast/api";
import { exec } from "child_process";
import { ReactElement } from "react";
import open from "open";
import { addSelected } from "./cache";
import { CopyToClipboard, DeleteInCache, GenCommand, getPath, init, queryProcess, realSearch } from "./util";
interface Preference {
  projectBasePath: string;
  level: number;
  showFullPath: boolean;
  localOpenCmd: string;
  localOpenCmdSecondary: string;
}

const terminalPath = "/Applications/iTerm.app";
const preference: Preference = getPreferenceValues();
const path = environment.assetsPath;
const script = path + "/lsall.py";
const cacheKey = "local";

function runShellCommand(command: string, path: string) {
  const safePath = path.replace(/'/g, "'\\''");
  const fullCommand = `zsh -l -c '${command} "${safePath}"'`;
  exec(fullCommand);
}

function search(text: string) {
  text = queryProcess(text);
  realSearch(text, createElement, (reshandler: (arg0: string) => void) => {
    exec(
      ["python3", script, preference.projectBasePath, preference.level, 40, text].join(" "),
      (err, stdout, stderr) => {
        reshandler(stdout);
      }
    );
  });
}

init(cacheKey, search);

export default function Command() {
  return GenCommand();
}

function createElement(path: string, recentOpen: boolean): ReactElement {
  const realPath = getPath(path);
  const showPath = preference.showFullPath ? realPath : path;
  const primaryCmd = preference.localOpenCmd || "code";
  const secondaryCmd = preference.localOpenCmdSecondary;

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
              title={`Open in ${primaryCmd}`}
              icon="command-icon.png"
              onAction={() => {
                addSelected(cacheKey, path);
                runShellCommand(primaryCmd, realPath);
                closeMainWindow();
              }}
            />
            {secondaryCmd && (
              <Action
                title={`Open in ${secondaryCmd}`}
                key="secondary"
                icon="command-icon.png"
                shortcut={{ modifiers: ["cmd"], key: "enter" }}
                onAction={() => {
                  addSelected(cacheKey, path);
                  runShellCommand(secondaryCmd, realPath);
                  closeMainWindow();
                }}
              />
            )}
            {CopyToClipboard(path)}
            <Action.ShowInFinder
              title="Open in Finder"
              path={realPath}
              onShow={() => {
                addSelected(cacheKey, path);
              }}
            />
            <Action
              title="Open in Terminal"
              key="terminal"
              onAction={() => {
                addSelected(cacheKey, path);
                open(realPath, { app: { name: terminalPath, arguments: [realPath] } });
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
