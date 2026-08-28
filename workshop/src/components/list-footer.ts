export function renderListFooter(activeCount: number, onClearCompleted: () => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-200';

  const count = document.createElement('span');
  count.textContent = `${activeCount} ${activeCount === 1 ? 'item' : 'items'} left`;

  const clear = document.createElement('button');
  clear.textContent = 'Clear completed';
  clear.className = 'hover:text-slate-600 hover:underline';
  clear.addEventListener('click', onClearCompleted);

  wrap.append(count, clear);
  return wrap;
}
