"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Clipboard,
  Clock3,
  Download,
  Newspaper,
  Presentation,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";


const Skeleton = ({className}: {className?: string}) => <div className={`skeleton ${className || ""}`} />;

type Article = {
  id: string;
  title: string;
  url: string;
  source: string;
  domain: string;
  publishedAt: string;
};

type FeedResponse = {
  articles: Article[];
  provider: string;
  fetchedAt: string;
  partial?: boolean;
};

const TOPIC_TERMS: Record<string, string[]> = {
  all: [],
  platforms: ["platform", "social media", "content moderation", "tiktok", "instagram", "meta", "facebook", "youtube", "linkedin", "algorithm", "threads"],
  reputation: ["public relations", "crisis", "reputation", "communications", "brand", "backlash", "apology", "trust"],
  creators: ["creator", "influencer", "affiliate", "sponsor", "partnership"],
  ai: [" ai ", "artificial intelligence", "generative", "deepfake", "misinformation", "disinformation"],
  measurement: ["measurement", "analytics", "metric", "roi", "engagement", "strategy"],
};

const TOPICS = [
  { value: "all", label: "All PR + social" },
  { value: "platforms", label: "Platforms & policy" },
  { value: "reputation", label: "Reputation & crisis" },
  { value: "creators", label: "Creators & influencers" },
  { value: "ai", label: "AI & misinformation" },
  { value: "measurement", label: "Measurement & strategy" },
];

const categoryRules = [
  { label: "AI + trust", terms: [" ai ", "artificial intelligence", "deepfake", "misinformation", "disinformation"] },
  { label: "Platform policy", terms: ["platform", "tiktok", "instagram", "meta", "youtube", "linkedin", "x ", "moderation", "algorithm"] },
  { label: "Creator economy", terms: ["creator", "influencer", "sponsor", "affiliate"] },
  { label: "Crisis + reputation", terms: ["crisis", "reputation", "backlash", "apology", "boycott", "controversy"] },
  { label: "Measurement", terms: ["measurement", "analytics", "metric", "roi", "engagement"] },
];

function categoryFor(title: string) {
  const text = ` ${title.toLowerCase()} `;
  return categoryRules.find((rule) => rule.terms.some((term) => text.includes(term)))?.label ?? "PR practice";
}

function teachingAngle(article: Article) {
  const category = categoryFor(article.title);
  const angles: Record<string, string> = {
    "AI + trust": "Use this to examine how synthetic media, automation, and disclosure change credibility judgments.",
    "Platform policy": "Connect the platform decision to stakeholder access, message distribution, and organizational risk.",
    "Creator economy": "Evaluate the relationship among creator authenticity, sponsor control, and audience trust.",
    "Crisis + reputation": "Trace the gap between the organization’s response, stakeholder expectations, and reputational outcomes.",
    Measurement: "Interrogate what the reported metric captures, what it misses, and whether it supports a communication objective.",
    "PR practice": "Identify the publics, communication objective, strategic choices, and evidence of impact in this case.",
  };
  return angles[category];
}

function discussionQuestion(article: Article) {
  const category = categoryFor(article.title);
  const questions: Record<string, string> = {
    "AI + trust": "What disclosure would informed audiences reasonably need, and who is accountable if trust is damaged?",
    "Platform policy": "Which publics gain or lose power under this change, and how should communicators adapt?",
    "Creator economy": "Where should creator independence end and brand responsibility begin?",
    "Crisis + reputation": "What should the organization say or do next, and which stakeholder should it prioritize?",
    Measurement: "Which outcome would demonstrate real communication effectiveness beyond reach or engagement?",
    "PR practice": "What is the strongest strategic choice here, and what evidence would change your judgment?",
  };
  return questions[category];
}

function relativeDate(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const hours = Math.max(0, Math.floor(elapsed / 3_600_000));
  if (hours < 1) return "Just published";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sourceLabel(source: string) {
  return source
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function weekLabel() {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date());
}

function briefingMarkdown(selected: Article[]) {
  const lines = [
    "# ICYMI: Social Media + PR",
    `Week of ${weekLabel()}`,
    "",
    "## Opening frame",
    "This week’s stories show how platform decisions, public expectations, and communication choices shape organizational legitimacy.",
    "",
  ];
  selected.forEach((article, index) => {
    lines.push(
      `## ${index + 1}. ${article.title}`,
      `Source: ${sourceLabel(article.source)} | ${new Date(article.publishedAt).toLocaleDateString("en-US")}`,
      `Link: ${article.url}`,
      "",
      `**Why it matters:** ${teachingAngle(article)}`,
      "",
      `**Discuss:** ${discussionQuestion(article)}`,
      "",
    );
  });
  lines.push("## Synthesis", "What common tension connects these cases: control, credibility, transparency, or accountability?");
  return lines.join("\n");
}

export function NewsDesk() {
  const [topic, setTopic] = useState("all");
  const [days, setDays] = useState("7");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fetchedAt, setFetchedAt] = useState("");
  const [provider, setProvider] = useState("");
  const [copied, setCopied] = useState(false);
  const [presenting, setPresenting] = useState(false);

  async function loadNews() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(new URL("news.json", document.baseURI), { cache: "no-store" });
      const body = (await response.json()) as FeedResponse & { error?: string };
      if (!response.ok || !Array.isArray(body.articles)) throw new Error(body.error || "Unable to load the news feed.");
      if (!body.fetchedAt && !body.articles.length) throw new Error("News updates have not run yet. Run Update news and publish in the repository’s Actions tab.");
      const cutoff = Date.now() - Number(days) * 86_400_000;
      const terms = TOPIC_TERMS[topic] || [];
      const words = submittedQuery.toLowerCase().split(/\s+/).filter(Boolean);
      const filtered = body.articles.filter(article => {
        const title = ` ${article.title.toLowerCase()} `;
        return Date.parse(article.publishedAt) >= cutoff &&
          (!terms.length || terms.some(term => title.includes(term))) &&
          (!words.length || words.some(word => title.includes(word)));
      }).slice(0, 36);
      setArticles(filtered);
      setFetchedAt(body.fetchedAt);
      setProvider(`${body.provider}${body.partial ? " (some sources unavailable)" : ""}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load the news feed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNews();
  }, [topic, days, submittedQuery]);

  useEffect(() => {
    if (!presenting) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPresenting(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [presenting]);

  const selectedIds = useMemo(() => new Set(selected.map((article) => article.id)), [selected]);
  const topicName = TOPICS.find((item) => item.value === topic)?.label ?? TOPICS[0].label;

  function toggleArticle(article: Article) {
    setSelected((current) =>
      current.some((item) => item.id === article.id)
        ? current.filter((item) => item.id !== article.id)
        : [...current, article].slice(0, 5),
    );
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  async function copyBrief() {
    try { await navigator.clipboard.writeText(briefingMarkdown(selected)); }
    catch { window.alert("Clipboard access is unavailable. Use Download .md instead."); return; }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadBrief() {
    const blob = new Blob([briefingMarkdown(selected)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `icymi-brief-${new Date().toISOString().slice(0, 10)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (presenting) {
    return (
      <main className="presentation-shell">
        <button className="present-close" onClick={() => setPresenting(false)} aria-label="Exit presentation mode">
          <X size={21} /> Exit
        </button>
        <div className="presentation-kicker">ICYMI · WEEK OF {weekLabel().toUpperCase()}</div>
        <h1>Social Media + PR</h1>
        <p className="presentation-lede">What changed, why communicators should care, and what we should debate.</p>
        <div className="presentation-grid">
          {selected.map((article, index) => (
            <article key={article.id} className="presentation-card">
              <div className="presentation-count">0{index + 1}</div>
              <div>
                <div className="eyebrow-row">
                  <span>{categoryFor(article.title)}</span>
                  <span>{sourceLabel(article.source)}</span>
                </div>
                <h2>{article.title}</h2>
                <p><strong>Why it matters</strong>{teachingAngle(article)}</p>
                <p className="present-question"><strong>Discuss</strong>{discussionQuestion(article)}</p>
                <a href={article.url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={16} /></a>
              </div>
            </article>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="site-shell">
      <header className="masthead">
        <a className="brand" href="#top" aria-label="ICYMI home">
          <span className="brand-mark"><Newspaper size={19} /></span>
          <span>ICYMI</span>
        </a>
        <div className="masthead-meta">
          <span>Social Media for PR</span>
          <span className="live-dot" />
          <span>{fetchedAt ? `Updated ${relativeDate(fetchedAt)}` : "Publication feed"}</span>
        </div>
      </header>

      <section className="intro" id="top">
        <div>
          <div className="section-label"><span>WEEKLY DISCUSSION PREP</span><span>{weekLabel()}</span></div>
          <h1>Find the week’s<br /><em>teachable moments.</em></h1>
          <p>Scan current PR and social media coverage, select the strongest cases, and turn them into a discussion-ready class briefing.</p>
        </div>
        <div className="intro-index" aria-hidden="true">
          <span>PR</span>
          <div />
          <span>SM</span>
        </div>
      </section>

      <section className="controls" aria-label="News filters">
        <form className="search-box" onSubmit={submitSearch}>
          <Search size={18} aria-hidden="true" />
          <label className="sr-only" htmlFor="news-search">Add a keyword, organization, or platform</label>
          <input
            id="news-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Add a keyword, organization, or platform…"
          />
          <button type="submit">Search</button>
        </form>
        <div className="select-wrap">
          <span>Lens</span>
          <select aria-label="Choose a news topic" value={topic} onChange={event => setTopic(event.target.value)}>
            {TOPICS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="select-wrap">
          <span>Window</span>
          <select aria-label="Choose a date range" value={days} onChange={event => setDays(event.target.value)}>
            {[3,7,14,30].map(n => <option key={n} value={n}>Past {n} days</option>)}
          </select>
        </div>
        <button className="icon-button" onClick={() => void loadNews()} aria-label="Refresh news" disabled={loading}>
          <RefreshCw size={18} className={loading ? "spin" : ""} />
        </button>
      </section>

      <div className="workspace">
        <section className="feed" aria-labelledby="feed-title">
          <div className="feed-heading">
            <div>
              <span className="section-label">THE NEWSROOM</span>
              <h2 id="feed-title">{submittedQuery ? `“${submittedQuery}”` : topicName}</h2>
            </div>
            <div className="feed-count">{loading ? "—" : articles.length} STORIES</div>
          </div>

          {loading && (
            <div className="news-list" aria-label="Loading current stories">
              {[0, 1, 2, 3].map((item) => (
                <div className="story-skeleton" key={item}>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-5 h-7 w-11/12" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="empty-state">
              <Newspaper size={28} />
              <h3>News feed unavailable</h3>
              <p>{error}</p>
              <button onClick={() => void loadNews()}>Try again</button>
            </div>
          )}

          {!loading && !error && articles.length === 0 && (
            <div className="empty-state">
              <Search size={28} />
              <h3>No matching stories</h3>
              <p>Broaden the topic or date window and search again.</p>
            </div>
          )}

          {!loading && !error && (
            <div className="news-list">
              {articles.map((article) => {
                const active = selectedIds.has(article.id);
                return (
                  <article className={`story-card ${active ? "selected" : ""}`} key={article.id}>
                    <input type="checkbox"
                      checked={active}
                      onChange={() => toggleArticle(article)}
                      aria-label={`${active ? "Remove" : "Add"} ${article.title}`}
                      className="story-check"
                      disabled={!active && selected.length >= 5}
                    />
                    <div className="story-content">
                      <div className="story-meta">
                        <span className="topic-pill">{categoryFor(article.title)}</span>
                        <span>{sourceLabel(article.source)}</span>
                        <span>·</span>
                        <span>{relativeDate(article.publishedAt)}</span>
                      </div>
                      <h3>{article.title}</h3>
                      <p>{teachingAngle(article)}</p>
                    </div>
                    <a className="story-link" href={article.url} target="_blank" rel="noreferrer" aria-label={`Open ${article.title}`}>
                      <ArrowUpRight size={19} />
                    </a>
                  </article>
                );
              })}
            </div>
          )}
          {!loading && !error && fetchedAt && Date.now() - Date.parse(fetchedAt) > 48 * 3_600_000 && <p className="stale-note">The feed has not updated in over 48 hours. Check the scheduled workflow in GitHub Actions.</p>}
          {!loading && !error && provider && <p className="data-note">Coverage supplied by {provider}. Prompts are topic-based, not article summaries.</p>}
        </section>

        <aside className="brief-panel" aria-labelledby="brief-title">
          <div className="brief-topline">
            <span className="section-label">YOUR RUN OF SHOW</span>
            <span>{selected.length}/5</span>
          </div>
          <h2 id="brief-title">Weekly brief</h2>
          <div className="time-estimate"><Clock3 size={15} /> {selected.length ? `${3 + selected.length * 3} min discussion` : "Select stories to begin"}</div>

          {selected.length === 0 ? (
            <div className="brief-empty">
              <div><BookOpen size={26} /></div>
              <p>Choose up to five stories for a briefing with topic-based teaching prompts and discussion questions.</p>
            </div>
          ) : (
            <ol className="brief-list">
              {selected.map((article, index) => (
                <li key={article.id}>
                  <span className="brief-number">0{index + 1}</span>
                  <div>
                    <p>{article.title}</p>
                    <span>{categoryFor(article.title)}</span>
                  </div>
                  <button onClick={() => toggleArticle(article)} aria-label={`Remove ${article.title}`}><X size={16} /></button>
                </li>
              ))}
            </ol>
          )}

          <div className="brief-actions">
            <button className="primary-action" onClick={() => setPresenting(true)} disabled={!selected.length}>
              <Presentation size={17} /> Present brief
            </button>
            <button onClick={() => void copyBrief()} disabled={!selected.length}>
              {copied ? <Check size={17} /> : <Clipboard size={17} />} {copied ? "Copied" : "Copy notes"}
            </button>
            <button onClick={downloadBrief} disabled={!selected.length}>
              <Download size={17} /> Download .md
            </button>
          </div>
          {selected.length >= 5 && <p className="limit-note"><Sparkles size={14} /> Five stories is the briefing limit.</p>}
        </aside>
      </div>

      <footer>
        <span>ICYMI / DISCUSSION PREP</span>
        <span>Built for weekly classroom use</span>
      </footer>
    </main>
  );
}
