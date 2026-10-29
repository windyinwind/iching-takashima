// The engine reads the plugin's own data files, so the website, the MCP server and the
// Grok plugin always serve the same text.
import hexagramsJson from "../../../skills/zhouyi-lookup/scripts/zhouyi/hexagrams.json" with { type: "json" };
import linesJson from "../../../skills/zhouyi-lookup/scripts/zhouyi/lines.json" with { type: "json" };
import leggeJson from "../../../skills/zhouyi-lookup/scripts/zhouyi/legge.json" with { type: "json" };
import tradJson from "../../../skills/zhouyi-lookup/scripts/zhouyi/jing_trad.json" with { type: "json" };
import takashimaJson from "../../../skills/zhouyi-lookup/scripts/zhouyi/takashima.json" with { type: "json" };
import tablesJson from "./tables.json" with { type: "json" };

export type Hexagram = {
  number: number;
  name: string;
  upper: string;
  lower: string;
  judgment: string;
  lines: string[];
  yong?: { label: string; text: string };
};

export const HEXAGRAMS: Hexagram[] = (hexagramsJson as any).hexagrams;
export const LINE_MEANING: Record<string, { x: string; l: string; s: string[] }[]> = (linesJson as any).lines;
export const LEGGE: any = leggeJson;
export const TRAD: any = tradJson;
export const TAKASHIMA: any = takashimaJson;
export const T: any = tablesJson;
