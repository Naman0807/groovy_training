#!/usr/bin/env node
/**
 * Codebase Explainer — sends code context (≤10K tokens) to Gemini and returns an explanation.
 *
 * Usage:
 *   node explain.js /path/to/project "How does authentication work?"
 */

import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const TELEMETRY_CSV = path.resolve(
	import.meta.dirname,
	"..",
	"token-tracker",
	"telemetry.csv",
);

const ALLOWED_EXTENSIONS = new Set([
	".py",
	".js",
	".ts",
	".jsx",
	".tsx",
	".json",
	".yaml",
	".yml",
	".md",
	".html",
	".css",
	".sql",
	".rs",
	".go",
	".java",
	".rb",
]);

const MAX_FILE_SIZE = 5 * 1024;
const MAX_TOKENS = 10_000;
const MODEL = "gemini-2.5-flash-lite";
const OUTPUT_TOKENS = 1024;

const SYSTEM_PROMPT = `You are a senior software engineer explaining codebases to developers.
Given a project directory and a specific question, analyze the provided files and produce a clear, 
concise explanation. Focus on the architecture, data flow, and key design decisions relevant to 
the question. If you don't find enough context to answer fully, say so — don't invent details.
Use markdown formatting with bullet points. Be specific: mention file paths, function names, 
and line numbers where relevant.`;

// ~4 chars per token for estimation (no js-tiktoken dependency needed)
function countTokens(text) {
	return Math.ceil(text.length / 4);
}

function getRelevantFiles(root) {
	const files = [];
	function walk(dir) {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else if (
				entry.isFile() &&
				ALLOWED_EXTENSIONS.has(path.extname(entry.name))
			) {
				try {
					if (fs.statSync(full).size <= MAX_FILE_SIZE) {
						files.push(full);
					}
				} catch {
					/* skip unreadable */
				}
			}
		}
	}
	walk(root);
	return files.sort();
}

function readFileHeadTail(filePath, headChars = 2000, tailChars = 500) {
	let content;
	try {
		content = fs.readFileSync(filePath, "utf-8");
	} catch {
		return `# ${path.basename(filePath)}\n(unreadable file)\n`;
	}
	const name = path.basename(filePath);
	if (content.length <= headChars + tailChars) {
		return `# ${name}\n${content}\n`;
	}
	const head = content.slice(0, headChars);
	const tail = content.slice(-tailChars);
	return `# ${name}\n${head}\n\n... (truncated) ...\n\n${tail}\n`;
}

function buildContext(directory, question) {
	const files = getRelevantFiles(directory);
	const contextParts = [];
	const includedFiles = [];
	let budget = MAX_TOKENS - countTokens(question) - 200;

	for (const f of files) {
		const excerpt = readFileHeadTail(f);
		const tokens = countTokens(excerpt) + 10;
		if (budget - tokens < 0) break;
		contextParts.push(excerpt);
		budget -= tokens;
		includedFiles.push(f);
	}

	return { context: contextParts.join("\n---\n"), includedFiles };
}

async function appendTelemetry(entry) {
	const dir = path.dirname(TELEMETRY_CSV);
	fs.mkdirSync(dir, { recursive: true });
	const exists = fs.existsSync(TELEMETRY_CSV);
	const headers = Object.keys(entry);
	const line = headers
		.map((h) => {
			const v = entry[h];
			if (typeof v === "string" && (v.includes(",") || v.includes('"'))) {
				return `"${v.replace(/"/g, '""')}"`;
			}
			return String(v);
		})
		.join(",");

	if (!exists) {
		fs.writeFileSync(TELEMETRY_CSV, headers.join(",") + "\n" + line + "\n");
	} else {
		fs.appendFileSync(TELEMETRY_CSV, line + "\n");
	}
}

async function main() {
	const args = process.argv.slice(2);
	if (args.length < 2) {
		console.error("Usage: node explain.js <directory> <question>");
		process.exit(1);
	}

	const directory = path.resolve(args[0]);
	const question = args[1];

	if (!fs.existsSync(directory)) {
		console.error(`Error: directory not found: ${directory}`);
		process.exit(1);
	}

	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

	console.log("─".repeat(55));
	console.log("  Codebase Explainer");
	console.log(`  Project: ${directory}`);
	console.log(`  Question: ${question}`);
	console.log("─".repeat(55));
	console.log();

	const { context, includedFiles } = buildContext(directory, question);
	const actualTokens = countTokens(context);

	const queryHash = createHash("sha256")
		.update(MODEL + SYSTEM_PROMPT + question)
		.digest("hex")
		.slice(0, 12);

	const model = genAI.getGenerativeModel({
		model: MODEL,
		systemInstruction: SYSTEM_PROMPT,
	});

	const result = await model.generateContent(
		`Project files:\n\n${context}\n\nQuestion: ${question}`,
	);
	const response = result.response;

	const usage = response.usageMetadata;
	const promptTokens = usage.promptTokenCount;
	const completionTokens = usage.candidatesTokenCount;

	const inputCost = promptTokens * (0.1 / 1_000_000);
	const outputCost = completionTokens * (0.4 / 1_000_000);
	const totalCost = inputCost + outputCost;

	const entry = {
		timestamp: new Date().toISOString(),
		model: MODEL,
		prompt_tokens: promptTokens,
		completion_tokens: completionTokens,
		cost: totalCost.toFixed(6),
		cache_hit: "false",
		cache_read_tokens: 0,
		cache_create_tokens: 0,
		query_hash: queryHash,
	};
	await appendTelemetry(entry);

	const explanation = response.text();
	console.log(explanation);
	console.log();
	console.log("─".repeat(55));
	console.log(
		`Files analyzed: ${includedFiles.length} (${actualTokens} tokens)`,
	);
	console.log(`Model: ${MODEL} | Cost: $${totalCost.toFixed(6)}`);
	console.log("─".repeat(55));
}

main().catch(console.error);
