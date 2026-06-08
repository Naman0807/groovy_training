#!/usr/bin/env node
/* GroovyBot — multi-turn CLI chatbot using the Google Gemini Node.js SDK */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createInterface } from "readline";
import "dotenv/config";

const SYSTEM_PROMPT =
	"You are GroovyBot, a helpful CLI chatbot built during Day 6 of Groovy Web training. Be concise, friendly, and informative.";

async function main() {
	if (!process.env.GEMINI_API_KEY) {
		console.error("Error: GEMINI_API_KEY environment variable not set.");
		process.exit(1);
	}

	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
	const model = genAI.getGenerativeModel({
		model: "gemini-2.5-flash-lite",
		systemInstruction: SYSTEM_PROMPT,
	});
	const history = [];

	console.log("\x1b[36m╭──────────────────────────────────────────────╮");
	console.log("│  🤖 GroovyBot — Gemini CLI Chatbot          │");
	console.log("│  Type 'exit' or 'quit' to end               │");
	console.log("╰──────────────────────────────────────────────╯\x1b[0m");

	const rl = createInterface({ input: process.stdin, output: process.stdout });

	const ask = () =>
		new Promise((resolve) => rl.question("\x1b[33mYou: \x1b[0m", resolve));

	while (true) {
		const input = await ask();
		if (!input.trim()) continue;
		if (["exit", "quit"].includes(input.toLowerCase())) {
			console.log("\x1b[31mGoodbye!\x1b[0m");
			break;
		}

		try {
			const chat = model.startChat({ history });
			const result = await chat.sendMessage(input);
			const reply = result.response.text();

			history.push({ role: "user", parts: [{ text: input }] });
			history.push({ role: "model", parts: [{ text: reply }] });

			console.log(
				"\n\x1b[35m── GroovyBot ──────────────────────────────────\x1b[0m",
			);
			console.log(reply + "\n");
		} catch (err) {
			if (err.status === 429) {
				console.log("\x1b[31mRate limit hit. Waiting a moment...\x1b[0m");
			} else if (
				err.message?.includes("network") ||
				err.message?.includes("fetch")
			) {
				console.log("\x1b[31mConnection error. Check your network.\x1b[0m");
			} else {
				console.log(`\x1b[31mError: ${err.message}\x1b[0m`);
			}
		}
	}

	rl.close();
}

main();
