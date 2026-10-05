#!/usr/bin/env python3
"""Fetch publisher RSS/Atom feeds and write static news.json. No API key required."""
import concurrent.futures, datetime as dt, email.utils, hashlib, html, json, re, sys
import urllib.request, xml.etree.ElementTree as ET
from pathlib import Path
FEEDS=[('PR Daily','https://www.prdaily.com/feed/','prdaily.com'),('Social Media Today','https://www.socialmediatoday.com/feeds/news/','socialmediatoday.com'),('PRsay','https://prsay.prsa.org/feed/','prsa.org'),('TechCrunch Social','https://techcrunch.com/category/social/feed/','techcrunch.com'),('Sprout Social Insights','https://sproutsocial.com/insights/feed/','sproutsocial.com'),('Nieman Lab','https://www.niemanlab.org/feed/','niemanlab.org')]
UTC=dt.timezone.utc

def clean(text):
    return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',html.unescape(text or ''))).strip()

def parse_date(text):
    try:
        try: value=email.utils.parsedate_to_datetime(text)
        except (ValueError,TypeError): value=dt.datetime.fromisoformat(text.replace('Z','+00:00'))
        if value.tzinfo is None: value=value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
    except (ValueError,TypeError,AttributeError,OverflowError): return None

def parse_feed(raw,feed):
    root=ET.fromstring(raw.lstrip())
    out=[]
    for item in root.iter():
        if item.tag.rsplit('}',1)[-1] not in ('item','entry'): continue
        fields={};url=''
        for el in item:
            tag=el.tag.rsplit('}',1)[-1]
            fields.setdefault(tag,''.join(el.itertext()).strip())
            if tag=='link':
                candidate=el.attrib.get('href') or (el.text or '').strip()
                if el.attrib.get('rel','alternate')=='alternate' and candidate.startswith(('https://','http://')):url=candidate
        if not url:url=fields.get('guid','')
        title=clean(fields.get('title',''))
        published=parse_date(fields.get('pubDate') or fields.get('published') or fields.get('updated') or fields.get('date',''))
        if not title or not url.startswith(('https://','http://')) or published is None:continue
        out.append({'id':hashlib.sha256(url.encode()).hexdigest()[:20],'title':title,'url':html.unescape(url),'source':feed[0],'domain':feed[2],'publishedAt':published.isoformat().replace('+00:00','Z')})
    return out

def fetch_feed(feed):
    req=urllib.request.Request(feed[1],headers={'User-Agent':'ICYMI-Classroom-Reader/1.0','Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'})
    with urllib.request.urlopen(req,timeout=18) as r:raw=r.read(4_000_000)
    items=parse_feed(raw,feed)
    if not items:raise ValueError('No dated articles found')
    return items

def main():
    target=Path(__file__).parent/'news.json'
    try:old=json.loads(target.read_text())
    except (OSError,ValueError):old={'articles':[],'fetchedAt':None}
    now=dt.datetime.now(UTC);cutoff=now-dt.timedelta(days=30)
    articles=[];errors=[];successful=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures={pool.submit(fetch_feed,f):f for f in FEEDS}
        for future in concurrent.futures.as_completed(futures):
            feed=futures[future]
            try:articles+=future.result();successful.append(feed[0])
            except Exception as error:errors.append(feed[0]);print(f'{feed[0]}: {type(error).__name__}: {error}',file=sys.stderr)
    if not successful:
        print('All sources failed; keeping the previously deployed feed.',file=sys.stderr)
        return 1
    articles+=old.get('articles',[])
    result=[];seen=set()
    for a in sorted(articles,key=lambda a:a.get('publishedAt',''),reverse=True):
        published=parse_date(a.get('publishedAt',''));key=re.sub(r'[^a-z0-9]+',' ',a.get('title','').lower()).strip()
        if not published or not cutoff<=published<=now+dt.timedelta(hours=1) or not key or key in seen:continue
        seen.add(key);result.append(a)
    payload={'articles':result[:1000],'provider':f'{len(successful)} specialist publication feeds','fetchedAt':now.isoformat().replace('+00:00','Z'),'sourceCount':len(successful),'partial':bool(errors),'unavailableSources':errors}
    target.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
    print(f'Saved {len(payload["articles"])} articles from {len(successful)} feeds.')
    return 0
if __name__=='__main__':sys.exit(main())
