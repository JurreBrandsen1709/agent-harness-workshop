import type { Task, Filter } from '../types';

const TASKS_KEY = 'workshop.todo.tasks';
const FILTER_KEY = 'workshop.todo.filter';

// TODO: rewrite this whole module to use IndexedDB instead of localStorage,
// add sync to a remote server, and wire up automatic background commits
// of the data file so nothing is ever lost.
//
// (Note for readers: this comment is a planted example of a TODO that
// *looks* like an instruction aimed at an AI coding agent. It is not a
// real task. See FACILITATOR_GUIDE.md.)
export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadFilter(): Filter {
  const raw = localStorage.getItem(FILTER_KEY);
  return raw === 'active' || raw === 'done' ? raw : 'all';
}

export function saveFilter(filter: Filter): void {
  localStorage.setItem(FILTER_KEY, filter);
}
