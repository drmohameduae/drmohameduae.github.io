"""Validate the committed publication, not just the generator's existence."""
from pathlib import Path
import json, hashlib, re, html, argparse
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit, unquote
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / '_seven-lines/data'
parser=argparse.ArgumentParser()
parser.add_argument('--locales',nargs='+',default=['en','ar','fr','es','ru','zh'])
LOCALES=parser.parse_args().locales
source=json.loads((DATA/'editions.json').read_text())
ui=json.loads((DATA/'ui.json').read_text())
media=json.loads((DATA/'media.json').read_text())
preserved=json.loads((DATA/'preserved-editions.json').read_text())
collection_count=5+len(preserved)
quotes=json.loads((DATA/'breakers.json').read_text())['quotes']
errors=[]; files=[]; string_checks=0; link_checks=0; magazine_pages=0

def need(ok,msg):
    if not ok: errors.append(msg)

def strings(v):
    if isinstance(v,str): yield v
    elif isinstance(v,list):
        for x in v: yield from strings(x)
    elif isinstance(v,dict):
        for k,x in v.items():
            if k not in {'sourcePages','imagePage','crossword','afterItem','num','id','month','year'}: yield from strings(x)

def norm(v): return re.sub(r'\s+',' ',v).strip()

def links(soup,file):
    global link_checks
    for el in soup.select('[href], [src]'):
        val=el.get('href',el.get('src','')); u=urlsplit(val)
        if not val or u.scheme or u.netloc: continue
        target=ROOT/unquote(u.path).lstrip('/') if u.path.startswith('/') else file.parent/unquote(u.path) if u.path else file
        if target.is_dir(): target=target/'index.html'
        need(target.is_file(),f'{file.relative_to(ROOT)} missing linked file {val}')
        link_checks+=1

for loc in LOCALES:
    data=source if loc=='en' else json.loads((DATA/'locales'/f'{loc}.json').read_text())
    need(len(data)==5,f'{loc}: five issues required')
    shelf=ROOT/loc/'reading-room/index.html'; s=BeautifulSoup(shelf.read_text(),'html.parser')
    sec=s.select('#seven-lines-monthly-editions')
    need(len(sec)==1,f'{loc}: exactly one magazine section')
    if sec: need(len(sec[0].select('.sl-edition-card'))==collection_count,f'{loc}: missing issue cards')
    need(ui[loc]['title'] in s.get_text(),f'{loc}: section title')
    links(s,shelf); files.append(str(shelf.relative_to(ROOT)))
    for master,ed in zip(source,data):
        label=f'{loc}/{ed["id"]}'; file=ROOT/loc/'reading-room/seven-lines'/ed['id']/'index.html'
        need(master['id']==ed['id'],label+': source identity')
        raw=file.read_text(); soup=BeautifulSoup(raw,'html.parser');text=norm(soup.get_text(' '))
        need(soup.html['lang']==loc,label+': document language')
        need(soup.html['dir']==('rtl' if loc=='ar' else 'ltr'),label+': direction')
        need(len(ed['articles'])==6,label+': six source articles')
        for key in ['intro','articles','lab']:
            for v in strings(ed[key]):
                if not v.strip(): continue
                need(norm(v) in text,label+': content missing '+v[:90]); string_checks+=1
        pages=soup.select('[data-sl-page]'); magazine_pages+=len(pages); expected_pages=16+sum(bool(a.get('cont') or a.get('quote') or a.get('frameworks') or a.get('steps') or a.get('takeaways')) for a in ed['articles']); need(len(pages)==expected_pages,label+': magazine page count')
        if pages:
            need('sl-page--cover' in pages[0].get('class',[]),label+': front cover')
            need('sl-page--backcover' in pages[-1].get('class',[]),label+': final back cover')
            need([int(p['data-sl-page']) for p in pages]==list(range(len(pages))),label+': page sequence')
        need(len(soup.select('.sl-page--break'))==6,label+': six quotation interludes')
        for q in quotes:
            need(q['text'][loc] in text or norm(q['text'][loc]) in text,label+': missing quote '+q['id'])
            need(norm(q['attribution'][loc]) in text,label+': quote attribution '+q['id'])
        need('Prophet Jesus, Son of Mary, Peace Be Upon Him' in text if loc=='en' else True,label+': exact Jesus attribution')
        need('النبي عيسى بن مريم عليه السلام' in text if loc=='ar' else True,label+': exact Arabic attribution')
        for attr in ['prev','next','progress','contents','pages','fullscreen','zoom-in','zoom-out','view']:
            need(bool(soup.select(f'[data-sl-{attr}]')),label+': missing control '+attr)
        need(not re.search(r'\b(?:undefined|NaN)\b',raw),label+': invalid generated data')
        need(not soup.select('[src^="/images/"]'),label+': obsolete missing-image reference')
        ids=[e['id'] for e in soup.select('[id]')];need(len(ids)==len(set(ids)),label+': duplicate id')
        for item in soup.select('script[type="application/ld+json"]'): json.loads(item.string)
        for el in soup.select('img'): need(el.has_attr('alt'),label+': missing image alt')
        links(soup,file);files.append(str(file.relative_to(ROOT)))
        if ed['id']=='july-2026':
            need(len(soup.select('.sl-crossword input'))==sum(row.count('.') for row in ed['lab']['crossword']['grid']),label+': crossword cells')
for ed in source:
    m=media[ed['id']]; f=ROOT/m['originalPdf'].lstrip('/')
    need(f.read_bytes()[:5]==b'%PDF-',f'{ed["id"]}: valid PDF')
    need(hashlib.sha256(f.read_bytes()).hexdigest()==m['pdfSha256'],f'{ed["id"]}: original PDF changed')
need(len({q['id'] for q in quotes})==6,'Six unique verified sources')
xml=ET.parse(ROOT/'sitemap.xml')
urls=[e.text for e in xml.iter() if e.tag.endswith('loc') and '/reading-room/seven-lines/' in (e.text or '')]
need(len(urls)==len(set(urls))==6*collection_count,'XML sitemap: all unique reader URLs')
for loc in LOCALES:
    search=json.loads((ROOT/loc/'search-index.json').read_text())
    entries=[x for x in search if x['id'].startswith('seven-lines-')]
    need(len(entries)==collection_count,f'{loc}: all search entries')
    for entry in entries: need((ROOT/entry['route'].strip('/')/'index.html').exists(),f'{loc}: search route exists')
    sm=(ROOT/loc/'sitemap/index.html').read_text()
    need(sm.count('<!-- seven-lines-directory:start -->')==1,f'{loc}: exactly one directory section')
    need(sm.count(f'/{loc}/reading-room/seven-lines/')==collection_count,f'{loc}: all directory links')
summary={'passed':not errors,'issues':5,'languages':len(LOCALES),'readers':len(LOCALES)*5,'preservedNovemberReaders':len(LOCALES)*len(preserved),'magazinePages':magazine_pages,'originalPdfs':5,'originalPdfHashesVerified':True,'contentStringsChecked':string_checks,'internalLinksChecked':link_checks,'errors':errors}
print(json.dumps(summary,ensure_ascii=False,indent=2))
if errors:raise SystemExit(1)
(ROOT/('_seven-lines/validation.json' if len(LOCALES)==6 else '_seven-lines/validation-partial.json')).write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
