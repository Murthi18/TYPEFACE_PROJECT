import {observeReveal, $} from './utils.js';
import {initLogin, initSignup} from './auth.js';

function initTopbar(){
  const seg = $('#rangeSeg'); const select = $('#quickRange');
  if(seg && select){
    const pill = seg.querySelector('.seg-pill');
    const btns = Array.from(seg.querySelectorAll('.seg-opt'));
    const setActive = (val)=>{
      const b = btns.find(x=>x.dataset.val===val) || btns[0];
      btns.forEach(x=>x.classList.toggle('active', x===b));
      const br = b.getBoundingClientRect(), pr = seg.getBoundingClientRect();
      const left = br.left - pr.left; pill.style.width = br.width + 'px';
      pill.style.transform = `translateX(${left}px)`;
    };
    btns.forEach(b=>b.addEventListener('click', ()=>{
      const v = b.dataset.val; select.value = v;
      select.dispatchEvent(new Event('change',{bubbles:true}));
      setActive(v);
    }));
    window.addEventListener('resize', ()=>setActive(select.value||'MTD'));
    setActive(select.value || 'MTD');
  }

  const search = $('#searchTxt');
  window.addEventListener('keydown', (e)=>{
    if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); search?.focus(); }
  });

  const profile = $('#profileMenu');
  profile?.querySelector('.avatar')?.addEventListener('click', ()=>{
    const open = profile.classList.toggle('open');
    profile.querySelector('.avatar').setAttribute('aria-expanded', open?'true':'false');
  });
  document.addEventListener('click', (e)=>{
    if(profile && !profile.contains(e.target)) profile.classList.remove('open');
  });

  $('#themeToggle')?.addEventListener('click', ()=>{ document.body.classList.toggle('theme-alt'); });

  const top = document.querySelector('.topbar.hc');
  const onScroll = ()=> top?.classList.toggle('scrolled', window.scrollY>6);
  onScroll(); window.addEventListener('scroll', onScroll);
}

function page(){
  const p = document.body.dataset.page;
  if(p==='login') initLogin();
  if(p==='signup') initSignup();
  if(p==='dashboard'){
    initTopbar();
  }
  observeReveal();
}
document.addEventListener('DOMContentLoaded', page);
