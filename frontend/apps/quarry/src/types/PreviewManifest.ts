export type PreviewManifest = {
  frameworkId: string;
  revision: string;
  previewUri: string;
  componentIds: string[];
  buildId: string;
  protocolVersion: number;
  isIllustrative: boolean;
};
