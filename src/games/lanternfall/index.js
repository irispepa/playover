// Placeholder until the game lands.
export default {
  start(ctx) {
    const b = document.createElement('button');
    b.textContent = 'Coming soon — back';
    b.style.cssText = 'position:absolute;inset:0;margin:auto;height:44px;width:220px;pointer-events:auto';
    b.onclick = () => ctx.exit();
    ctx.root.append(b);
    return { dispose() { b.remove(); } };
  },
};
