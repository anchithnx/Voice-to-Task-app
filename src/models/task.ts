export interface Task {
  id?: number;
  task: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  createdAt: string;
}

export interface ExtractedTaskJson {
  task: string;
  date: string;
  time: string;
}

export function fromExtractionJson(json: ExtractedTaskJson): Task {
  return {
    task: json.task || 'Untitled task',
    date: json.date || '',
    time: json.time || '',
    createdAt: new Date().toISOString(),
  };
}
