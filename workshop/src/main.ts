import './style.css';
import { TodoStore } from './state/todoStore';
import { TodoFeature } from './features/todo/todoFeature';
import { renderAddTodoForm } from './components/add-todo-form';
import { renderTodoList } from './components/todo_list';
import { renderListFooter } from './components/list-footer';
import type { Filter } from './types';

const store = new TodoStore();
const feature = new TodoFeature(store);

const app = document.getElementById('app')!;

function render() {
  app.innerHTML = '';

  const heading = document.createElement('h1');
  heading.textContent = 'todo_app';
  heading.className = 'text-xl font-semibold mb-4';

  const form = renderAddTodoForm((text) => {
    feature.addTask(text);
    render();
  });

  const filters = renderFilters(store.getFilter(), (f) => {
    store.setFilter(f);
    render();
  });

  const list = renderTodoList(
    feature.visible(),
    (id) => {
      feature.completeTask(id);
      render();
    },
    (id) => {
      feature.deleteTask(id);
      render();
    }
  );

  const footer = renderListFooter(feature.activeCount(), () => {
    feature.clearCompleted();
    render();
  });

  app.append(heading, form, filters, list, footer);
}

function renderFilters(current: Filter, onChange: (f: Filter) => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'flex gap-2 mb-2 text-sm';
  (['all', 'active', 'done'] as Filter[]).forEach((f) => {
    const btn = document.createElement('button');
    btn.textContent = f;
    btn.className = f === current ? 'font-semibold underline' : 'text-slate-400';
    btn.addEventListener('click', () => onChange(f));
    wrap.append(btn);
  });
  return wrap;
}

render();
