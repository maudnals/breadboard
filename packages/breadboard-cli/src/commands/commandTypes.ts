import { Options } from "./lib/loader.js";
import { config } from "dotenv";

export type RunOptions = Options & {
  kit?: string[];
  proxy?: string[];
  proxyNode: string[];
  input?: string;
  inputFile?: string;
  verbose?: boolean;
};

export type DebugOptions = Options;
export type ImportOptions = Options & {
  api?: string; // API URL for import
};
export type MakeOptions = Options;
export type MermaidOptions = Options;
export type ProxyOptions = Options & {
  config?: string;
  kit?: string[];
  dist?: string;
  port: string;
  proxyNode: string[];
};
