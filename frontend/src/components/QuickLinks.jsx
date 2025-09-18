import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, ExternalLink, Search, Link as LinkIcon } from "lucide-react";

const SOURCE_STYLES = {
  yahoo: {
    dark: "bg-violet-500/15 text-violet-300 hover:bg-violet-500/20",
    light: "bg-violet-100 text-violet-700 hover:bg-violet-200"
  },
  google: {
    dark: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20",
    light: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
  },
};

function StockAvatar({ symbol, isDark }) {
  // Simple avatar: full symbol
  return (
    <div
      className={`flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-semibold text-xs ${
        isDark ? "bg-slate-800 text-slate-200 ring-1 ring-slate-700" : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
      }`}
      aria-hidden
    >
      {symbol}
    </div>
  );
}

function SourcePill({ href, label, kind = "yahoo", isDark }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${SOURCE_STYLES[kind][isDark ? 'dark' : 'light']}`}
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
      {label}
    </a>
  );
}

const QuickLinks = ({ stocks = [], isDark = false }) => {
  const [query, setQuery] = useState("");
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter((s) => s.symbol?.toLowerCase().includes(q));
  }, [stocks, query]);

  // Removed auto-focus to prevent blue cursor line on page load

  if (stocks.length === 0) {
    return (
      <div
        className={`p-6 rounded-xl border shadow-sm ${
          isDark ? "bg-gray-800/30 border-gray-700/50" : "bg-white border-gray-100"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>News</h3>
          <span
            className={`text-xs px-2 py-1 rounded-md ${
              isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
            }`}
          >
            0
          </span>
        </div>
        <div className="text-center py-10">
          <Newspaper className={`w-9 h-9 mx-auto mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>Follow stocks to see quick news links</p>
        </div>
      </div>
    );
  }

  const panelBase = isDark
    ? "bg-gray-800/30 border-gray-700/50"
    : "bg-white border-gray-100";

  return (
    <div className={`p-0 rounded-xl border shadow-sm overflow-hidden ${panelBase}`}>
      {/* Sticky header */}
      <div
        className={`sticky top-0 z-10 px-6 pt-5 pb-4 flex items-center justify-between backdrop-blur ${
          isDark ? "bg-slate-900/60" : "bg-white/70"
        }`}
      >
        <div className="flex items-center gap-2">
          <Newspaper className={`w-5 h-5 ${isDark ? "text-slate-300" : "text-slate-600"}`} />
          <h3 className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>News</h3>
          <span
            className={`ml-2 text-xs px-2 py-0.5 rounded-md ${
              isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
            }`}
          >
            {stocks.length}
          </span>
        </div>

        {/* Open All (Yahoo) */}
        <a
          href={`https://finance.yahoo.com/topic/stock-market-news/`}
          target="_blank"
          rel="noopener noreferrer"
          className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
            isDark
              ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          Open Market News
        </a>
      </div>

      {/* Search */}
      <div ref={listRef} className="px-6 pb-3">
        <div
          className={`group relative flex items-center rounded-lg overflow-hidden border ${
            isDark ? "bg-slate-900/60 border-slate-700/50" : "bg-gray-50 border-gray-200"
          }`}
        >
          <Search className={`w-4 h-4 ml-3 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
          <input
            data-news-search
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickers…"
            className={`w-full bg-transparent outline-none text-sm px-3 py-2.5 ${
              isDark ? "placeholder:text-slate-500 text-slate-200" : "placeholder:text-slate-400 text-slate-800"
            }`}
          />
        </div>
      </div>

      {/* List */}
      <div className="px-2 pb-4">
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-2">
          <AnimatePresence initial={false}>
            {filtered.map((stock, idx) => {
              const sym = stock.symbol?.toUpperCase() || "TICK";
              const yahoo = `https://finance.yahoo.com/quote/${sym}/news`;
              const gnews = `https://www.google.com/search?q=${encodeURIComponent(sym + " stock news")}&tbm=nws`;
              return (
                <motion.div
                  key={sym}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, delay: idx * 0.02 }}
                >
                  <a
                    href={yahoo}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.click();
                    }}
                    className={`group flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 transition-colors ${
                      isDark ? "hover:bg-slate-800/60 focus:bg-slate-800/60" : "hover:bg-slate-50 focus:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <StockAvatar symbol={sym} isDark={isDark} />
                      <div>
                        <div className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                          {stock.name || sym}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <SourcePill href={yahoo} label="Yahoo" kind="yahoo" isDark={isDark} />
                      <SourcePill href={gnews} label="Google" kind="google" isDark={isDark} />
                    </div>
                  </a>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="px-3.5 py-6 text-center">
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                No matches for <span className="font-semibold">“{query}”</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickLinks;
