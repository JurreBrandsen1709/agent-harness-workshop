import type { Task } from '../types';
import { cx } from '../utils/helpers';

export function renderTodoItem(task: Task, onToggle: (id: number) => void, onRemove: (id: number) => void): HTMLElement {
  const li = document.createElement('li');
  li.className = 'flex items-center justify-between gap-2 py-2 border-b border-slate-200 last:border-0';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.className = 'shrink-0';
  checkbox.addEventListener('change', () => onToggle(task.id));

  const label = document.createElement('span');
  label.textContent = task.label;
  label.className = cx('flex-1', task.done && 'line-through text-slate-400');

  const left = document.createElement('label');
  left.className = 'flex items-center gap-2 flex-1 cursor-pointer';
  left.append(checkbox, label);

  const del = document.createElement('button');
  del.textContent = 'x';
  del.className = 'text-slate-400 hover:text-red-500 px-2';
  del.addEventListener('click', () => onRemove(task.id));

  li.append(left, del);
  return li;
}
