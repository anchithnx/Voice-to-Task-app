// Talks to a local Ollama instance over the network (e.g. running on
// your PC at http://<pc-ip>:11434). No API key, no cost.
//
// Update OLLAMA_HOST to your machine's LAN IP while testing. For a
// real deployed app, this needs to either bundle a local model
// on-device or point at a self-hosted Ollama server you control.

import { Task, fromExtractionJson } from '../models/task';

const OLLAMA_HOST = 'http://192.168.1.100:11434'; // <-- update to your PC's IP
const MODEL = 'llama3.1';

class OllamaService {
  async extractTask(transcript: string): Promise<Task> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const prompt = `
Extract a task, date, and time from the sentence below.
Resolve relative dates (e.g. "tomorrow", "next Monday") using today's date: ${todayStr}.
Return ONLY valid JSON, no explanation, no markdown, in exactly this shape:
{"task": "...", "date": "YYYY-MM-DD", "time": "HH:mm"}

Sentence: "${transcript}"
`;

    try {
      const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status}`);
      }

      const body = (await response.json()) as any;
      const rawText: string = body.response.trim();

      const jsonStr = this.extractJsonBlock(rawText);
      const extracted = JSON.parse(jsonStr);

      return fromExtractionJson(extracted);
    } catch (error: any) {
      console.warn('[Ollama Service] Offline or unavailable. Falling back to local heuristic extraction.', error.message ?? error);
      
      // Heuristic fallback: Use the entire transcript as the task title, default to today's date
      return fromExtractionJson({
        task: transcript || 'Untitled Voice Task',
        date: todayStr,
        time: new Date().toTimeString().split(' ')[0].substring(0, 5), // Current HH:mm
      });
    }
  }

  // Ollama models sometimes wrap JSON in prose or code fences even
  // when told not to — this pulls out the first {...} block.
  private extractJsonBlock(text: string): string {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      throw new Error(`No JSON object found in Ollama response: ${text}`);
    }
    return text.substring(start, end + 1);
  }
}

export default new OllamaService();
