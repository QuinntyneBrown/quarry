import type { DesignSystemPreviewPanelProperties } from "../types/DesignSystemPreviewPanelProperties";

export function DesignSystemPreviewPanel({ frameworkName, designSystemUri }: DesignSystemPreviewPanelProperties): React.JSX.Element {
  return <iframe title={`${frameworkName} design system`} src={designSystemUri}
    sandbox="allow-scripts" referrerPolicy="no-referrer"
    allow="camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'; fullscreen 'none'"
    style={{ width: "100%", height: "480px", border: "1px solid #ccd3de" }} />;
}
