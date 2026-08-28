import type { Task } from '../types';
import { renderTodoItem } from './TodoItem';

export function renderTodoList(tasks: Task[], onToggle: (id: number) => void, onRemove: (id: number) => void): HTMLElement {
  const ul = document.createElement('ul');
  if (tasks.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Nothing here yet.';
    empty.className = 'text-slate-400 text-sm py-4 text-center';
    ul.append(empty);
    return ul;
  }
  for (const task of tasks) {
    ul.append(renderTodoItem(task, onToggle, onRemove));
  }
  return ul;
}
