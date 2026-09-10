export type PreviewMessage = {
  type: "ready" | "failure" | "dismiss" | "focus-exit";
  sessionToken: string;
  protocolVersion: 1;
  direction?: "forward" | "backward";
};
