const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const ROOT=require('node:path').resolve(__dirname,'..');
const reader=fs.readFileSync(ROOT+'/assets/seven-lines.js','utf8');
let checks=0;
function check(condition,message){assert(condition,message);checks++;}
function create(locale='en',reduced=true,issue='june-2026',hash='') {
 const html=fs.readFileSync(`${ROOT}/${locale}/reading-room/seven-lines/${issue}/index.html`,'utf8');
 const dom=new JSDOM(html,{url:`https://drmohameduae.github.io/${locale}/reading-room/seven-lines/${issue}/${hash}`,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document;
 w.matchMedia=()=>({matches:reduced,addEventListener(){},removeEventListener(){}});
 Object.defineProperty(w.HTMLElement.prototype,'inert',{get(){return this.hasAttribute('inert')},set(v){this.toggleAttribute('inert',v)}});
 const focus=w.HTMLElement.prototype.focus;
 w.HTMLElement.prototype.focus=function(...args){assert(!this.closest('[inert]'),'Cannot focus inactive page');return focus.apply(this,args)};
 w.HTMLElement.prototype.scrollIntoView=function(){this.dataset.scrolled='true'};
 w.eval(reader);d.dispatchEvent(new w.Event('DOMContentLoaded'));
 const book=d.querySelector('[data-sl-book]'), pages=[...book.querySelectorAll('[data-sl-page]')];
 const click=attr=>book.querySelector(`[data-sl-${attr}]`).click();
 const key=(value,target=book)=>target.dispatchEvent(new w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
 const current=()=>Number(book.dataset.currentPage);
 return {dom,w,d,book,pages,click,key,current};
}
for(const locale of ['en','ar','fr','es','ru','zh']) {
 const x=create(locale),{w,d,book,pages,click,key,current}=x;
 check(pages.length===22,locale+' page count');
 check(current()===1,'initial cover');
 check(book.querySelector('[data-sl-prev]').disabled,'first boundary');
 check(pages.slice(1).every(p=>p.inert&&p.getAttribute('aria-hidden')==='true'),'inactive inaccessible');
 click('contents');check(current()===2,'contents');check(d.activeElement===pages[1],'focus destination');
 const toc=pages[1].querySelector('[data-sl-goto]');toc.click();check(current()===3,'contents article link');
 key('End');check(current()===pages.length,'back cover');check(book.querySelector('[data-sl-next]').disabled,'last boundary');
 key('Home');check(current()===1,'home');
 key(locale==='ar'?'ArrowLeft':'ArrowRight');check(current()===2,'direction-aware next');
 key(locale==='ar'?'ArrowRight':'ArrowLeft');check(current()===1,'direction-aware previous');
 const select=book.querySelector('[data-sl-pages]');select.value='6';select.dispatchEvent(new w.Event('change',{bubbles:true}));
 check(current()===7,'page selector');check(d.activeElement===pages[6],'selector focuses destination');
 for(let i=0;i<10;i++) click('zoom-in');check(book.style.getPropertyValue('--sl-text-scale')==='1.6','text max');
 check(book.querySelector('[data-sl-zoom-in]').disabled,'max button');
 for(let i=0;i<10;i++) click('zoom-out');check(book.style.getPropertyValue('--sl-text-scale')==='1','text min');
 click('view');check(book.classList.contains('sl-book--linear'),'continuous mode');check(pages.every(p=>!p.inert&&!p.hasAttribute('aria-hidden')),'continuous access');
 click('view');check(!book.classList.contains('sl-book--linear'),'magazine mode');check(pages.filter(p=>!p.inert).length===1,'single accessible page');
 click('fullscreen');check(book.classList.contains('sl-book--immersive'),'fullscreen fallback');check(d.body.style.overflow==='hidden','fullscreen body lock');
 key('Escape');check(!book.classList.contains('sl-book--immersive')&&d.body.style.overflow==='','fullscreen exit');
 w.location.hash='#page-8';w.dispatchEvent(new w.Event('hashchange'));check(current()===8,'URL direct page');
 w.dispatchEvent(new w.Event('beforeprint'));check(pages.every(p=>!p.inert),'print all pages');
 w.dispatchEvent(new w.Event('afterprint'));check(pages.filter(p=>!p.inert).length===1,'restore after print');
 x.dom.window.close();
}
{
 const x=create('en',false),{w,d,book,pages,click,current}=x;
 click('contents');check(current()===2,'animated contents');check(pages[0].classList.contains('is-turn-out-next'),'outgoing animation');check(d.activeElement===pages[1],'animated focus');
 click('next');pages[0].dispatchEvent(new w.Event('animationend'));check(current()===3,'queued turn runs');
 pages[1].dispatchEvent(new w.Event('animationend'));check(!book.querySelector('.is-over'),'animation cleans up');
 click('prev');check(pages[1].classList.contains('is-turn-in-prev'),'reverse animation');pages[1].dispatchEvent(new w.Event('animationend'));check(current()===2,'reverse page');
 x.dom.window.close();
}
{
 const x=create('ar',true,'july-2026'),{w,book,pages,click,key,current}=x;
 const index=pages.findIndex(p=>p.querySelector('.sl-crossword'));
 const select=book.querySelector('[data-sl-pages]');select.value=String(index);select.dispatchEvent(new w.Event('change'));
 const input=pages[index].querySelector('input');input.focus();const before=current();key('ArrowLeft',input);check(current()===before,'typing does not turn page');
 click('fullscreen');input.focus();key('Escape',input);check(!book.classList.contains('sl-book--immersive'),'Escape exits fullscreen from crossword');
 x.dom.window.close();
}
{
 const x=create('en',true,'october-2026','#page-20');check(x.pages.length===20,'October concise exercises');check(x.current()===20,'load direct back-cover URL');x.dom.window.close();
}
{
 const x=create('en'),{w,d}=x;
 w.localStorage.setItem('drmohamed.locale','ar');
 w.eval(fs.readFileSync(ROOT+'/assets/site.js','utf8'));
 check(d.querySelector('[data-language-select]').value==='en','language selector matches actual page despite saved preference');
 x.dom.window.close();
}
console.log(JSON.stringify({passed:true,checks,coverage:['6 locales','LTR/RTL keyboard','focus and inert','page turns and queue','contents and selector','direct URL','text enlargement','continuous mode','fullscreen fallback','crossword keyboard','print state','back cover']},null,2));
