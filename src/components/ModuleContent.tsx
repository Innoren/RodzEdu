import { toRenderableModuleHtml } from "@/lib/formatModuleHtml";

export function ModuleContent({ content }: { content: string }) {
  const html = toRenderableModuleHtml(content);

  return (
    <div
      className="module-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
