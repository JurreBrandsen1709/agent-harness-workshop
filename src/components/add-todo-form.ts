export function renderAddTodoForm(onAdd: (text: string) => void): HTMLElement {
  const form = document.createElement('form');
  form.className = 'flex gap-2 mb-4';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'What needs doing?';
  input.className = 'flex-1 border border-slate-300 rounded px-3 py-2 text-sm';

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Add';
  btn.className = 'bg-slate-800 text-white rounded px-4 py-2 text-sm';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input.value.trim()) return;
    onAdd(input.value);
    input.value = '';
  });

  form.append(input, btn);
  return form;
}
