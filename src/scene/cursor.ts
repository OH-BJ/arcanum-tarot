// 여러 3D 오브젝트가 커서를 공유하므로, 하나라도 호버 중이면 pointer
const sources = new Set<string>();

export function setHoverCursor(source: string, on: boolean) {
  if (on) sources.add(source);
  else sources.delete(source);
  const cursor = sources.size > 0 ? "pointer" : "auto";
  if (document.body.style.cursor !== cursor) document.body.style.cursor = cursor;
}
