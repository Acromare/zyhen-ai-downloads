// Shared moving highlight, inspired by Ibelick's Animated Tabs on 21st.dev.
const screens = {
  models: ['模型选择页面', '模型选择：按名称查找，或切换到另一个供应商。'],
  appearance: ['外观设置页面', '外观设置：切换深浅主题，调整字号。'],
  settings: ['应用设置分类页面', '应用设置：管理偏好、本机数据和 App 版本。'],
};
const rail = document.querySelector('.tabs');
const buttons = [...rail.querySelectorAll('button')];
const image = document.querySelector('#screen');
const frame = image.parentElement;
const caption = document.querySelector('#caption');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let selected = 0;
let transition;

rail.setAttribute('role', 'tablist');
frame.id = 'preview-panel';
frame.setAttribute('role', 'tabpanel');
function highlight() {
  const button = buttons[selected];
  rail.style.setProperty('--left', `${button.offsetLeft}px`);
  rail.style.setProperty('--width', `${button.offsetWidth}px`);
}
function select(index, focus = false) {
  const previous = selected;
  selected = index;
  buttons.forEach((button, i) => {
    button.setAttribute('aria-selected', String(i === index));
    button.tabIndex = i === index ? 0 : -1;
  });
  const button = buttons[index];
  frame.setAttribute('aria-labelledby', button.id);
  highlight();
  if (focus) button.focus();
  if (index === previous) return;
  const key = button.dataset.pick;
  image.src = `media/${key}.webp`;
  [image.alt, caption.textContent] = screens[key];
  transition?.cancel();
  if (!reduced.matches && image.animate) {
    transition = image.animate([
      { opacity: 0.4, transform: `translateX(${Math.sign(index - previous) * 16}px)` },
      { opacity: 1, transform: 'none' },
    ], { duration: 250, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
}
buttons.forEach((button, i) => {
  button.id = `preview-${button.dataset.pick}`;
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-controls', frame.id);
  button.removeAttribute('aria-pressed');
  button.addEventListener('click', () => select(i));
  button.addEventListener('keydown', event => {
    const last = buttons.length - 1;
    const destination = { ArrowLeft: (i + last) % buttons.length, ArrowRight: (i + 1) % buttons.length, Home: 0, End: last }[event.key];
    if (destination !== undefined) { event.preventDefault(); select(destination, true); }
  });
});
select(0);
rail.classList.add('animated-tabs');
highlight();
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(highlight).observe(rail);
window.addEventListener('resize', highlight);
document.fonts?.ready.then(highlight);

let touch;
frame.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch' || !event.isPrimary) return;
  touch = { x: event.clientX, y: event.clientY, id: event.pointerId };
  frame.setPointerCapture(event.pointerId);
});
frame.addEventListener('pointercancel', () => { touch = undefined; });
frame.addEventListener('pointerup', event => {
  if (!touch || event.pointerId !== touch.id) return;
  const dx = event.clientX - touch.x, dy = event.clientY - touch.y;
  touch = undefined;
  if (Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    select(Math.max(0, Math.min(buttons.length - 1, selected - Math.sign(dx))));
  }
});

document.querySelector('#copy').addEventListener('click', async () => {
  const url = new URL('latest.json', document.baseURI).href;
  const feedback = document.querySelector('#copied');
  try { await navigator.clipboard.writeText(url); feedback.textContent = '已复制'; }
  catch { feedback.textContent = url; }
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('reveal'); observer.unobserve(entry.target); }
  }));
  document.querySelectorAll('.guide h2,.guide p,.tabs,figure,.help h2,details,.foot').forEach(el => observer.observe(el));
}
