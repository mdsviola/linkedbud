// RSS Feeds organized by category from https://themeisle.com/blog/rss-feeds-list/

export interface RSSFeed {
  title: string;
  url: string;
}

export interface RSSFeedCategory {
  name: string;
  feeds: RSSFeed[];
}

export const RSS_FEEDS: RSSFeedCategory[] = [
  {
    name: "News & Current Affairs",
    feeds: [
      {
        title: "BBC News - Top Stories",
        url: "https://feeds.bbci.co.uk/news/rss.xml",
      },
      { title: "CNN - Top Stories", url: "http://rss.cnn.com/rss/edition.rss" },
      {
        title: "Reuters - World News",
        url: "http://feeds.reuters.com/Reuters/worldNews",
      },
      {
        title: "The Guardian - World",
        url: "https://www.theguardian.com/world/rss",
      },
      { title: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
      { title: "Associated Press", url: "https://apnews.com/rss" },
      { title: "NPR News", url: "https://feeds.npr.org/1001/rss.xml" },
      { title: "DW News", url: "https://rss.dw.com/rdf/rss-en-all" },
      { title: "Politico", url: "https://www.politico.com/rss/politics08.xml" },
      {
        title: "NY Times - Home Page",
        url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
      },
    ],
  },
  {
    name: "Technology & Startups",
    feeds: [
      { title: "TechCrunch", url: "http://feeds.feedburner.com/TechCrunch/" },
      { title: "Wired", url: "https://www.wired.com/feed/rss" },
      { title: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
      {
        title: "Ars Technica",
        url: "http://feeds.arstechnica.com/arstechnica/index/",
      },
      { title: "Mashable", url: "http://feeds.mashable.com/Mashable" },
      { title: "Hacker News (Top)", url: "https://news.ycombinator.com/rss" },
      {
        title: "Product Hunt - Today's Picks",
        url: "https://www.producthunt.com/feed",
      },
      { title: "Engadget", url: "https://www.engadget.com/rss.xml" },
      { title: "VentureBeat", url: "https://venturebeat.com/feed/" },
      { title: "Gizmodo", url: "https://gizmodo.com/rss" },
    ],
  },
  {
    name: "Business & Finance",
    feeds: [
      {
        title: "Bloomberg",
        url: "https://www.bloomberg.com/feed/podcast/etf-report.xml",
      },
      { title: "Forbes", url: "https://www.forbes.com/business/feed/" },
      {
        title: "CNBC",
        url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
      },
      { title: "Financial Times", url: "https://www.ft.com/?format=rss" },
      {
        title: "The Economist",
        url: "https://www.economist.com/latest/rss.xml",
      },
      { title: "Harvard Business Review", url: "https://hbr.org/feed" },
      {
        title: "MarketWatch",
        url: "https://www.marketwatch.com/rss/topstories",
      },
      {
        title: "WSJ - Business",
        url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
      },
      { title: "Business Insider", url: "https://www.businessinsider.com/rss" },
      {
        title: "Investopedia",
        url: "https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_articles",
      },
    ],
  },
  {
    name: "Sports",
    feeds: [
      { title: "ESPN", url: "https://www.espn.com/espn/rss/news" },
      { title: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
      { title: "Sky Sports", url: "https://www.skysports.com/rss/12040" },
      {
        title: "Sports Illustrated",
        url: "https://www.si.com/rss/si_topstories.rss",
      },
      {
        title: "Formula 1",
        url: "https://www.formula1.com/rss/news/headlines.rss",
      },
      { title: "NBA", url: "https://www.nba.com/rss/nba_rss.xml" },
      {
        title: "NFL",
        url: "https://www.nfl.com/rss/rsslanding?searchString=home",
      },
      { title: "The Athletic", url: "https://theathletic.com/feed/" },
      { title: "FIFA", url: "https://www.fifa.com/rss-feeds/" },
      { title: "Eurosport", url: "https://www.eurosport.com/rss.xml" },
    ],
  },
  {
    name: "Entertainment & Pop Culture",
    feeds: [
      { title: "Variety", url: "https://variety.com/feed/" },
      {
        title: "Rolling Stone",
        url: "https://www.rollingstone.com/music/music-news/feed/",
      },
      { title: "Billboard", url: "https://www.billboard.com/feed/" },
      { title: "IMDB News", url: "https://www.imdb.com/news/feed" },
      {
        title: "E! Online",
        url: "https://www.eonline.com/syndication/feeds/rssfeeds/topstories",
      },
      { title: "MTV News", url: "http://www.mtv.com/news/rss/" },
      { title: "Pitchfork", url: "https://pitchfork.com/rss/reviews/albums/" },
      { title: "Deadline", url: "https://deadline.com/feed/" },
      {
        title: "Hollywood Reporter",
        url: "https://www.hollywoodreporter.com/t/feed/",
      },
      { title: "Entertainment Weekly", url: "https://ew.com/feed/" },
    ],
  },
  {
    name: "Health & Wellness",
    feeds: [
      {
        title: "WHO - News",
        url: "https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml",
      },
      { title: "Healthline", url: "https://www.healthline.com/rss" },
      {
        title: "Medical News Today",
        url: "https://www.medicalnewstoday.com/rss",
      },
      {
        title: "WebMD",
        url: "https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC",
      },
      {
        title: "Harvard Health Blog",
        url: "https://www.health.harvard.edu/blog/feed",
      },
      { title: "Mayo Clinic", url: "https://newsnetwork.mayoclinic.org/feed/" },
      { title: "NHS News", url: "https://www.england.nhs.uk/feed/" },
      {
        title: "Psychology Today",
        url: "https://www.psychologytoday.com/us/rss",
      },
      {
        title: "Everyday Health",
        url: "https://www.everydayhealth.com/rss/all.aspx",
      },
      {
        title: "Medscape",
        url: "https://www.medscape.com/rss/siteupdates.xml",
      },
    ],
  },
  {
    name: "Travel & Lifestyle",
    feeds: [
      { title: "Lonely Planet", url: "https://www.lonelyplanet.com/blog.rss" },
      {
        title: "Conde Nast Traveler",
        url: "https://www.cntraveler.com/feed/rss",
      },
      {
        title: "Travel + Leisure",
        url: "https://www.travelandleisure.com/rss",
      },
      { title: "Nomadic Matt", url: "https://www.nomadicmatt.com/feed/" },
      { title: "The Points Guy", url: "https://thepointsguy.com/feed/" },
      { title: "Culture Trip", url: "https://theculturetrip.com/feed/" },
      {
        title: "Luxury Travel Magazine",
        url: "https://www.luxurytravelmagazine.com/rss",
      },
      { title: "Smarter Travel", url: "https://www.smartertravel.com/rss/" },
      {
        title: "Adventure Journal",
        url: "https://www.adventure-journal.com/feed/",
      },
      {
        title: "National Geographic Travel",
        url: "https://www.nationalgeographic.com/content/nationalgeographic/en_us/travel/rss",
      },
    ],
  },
  {
    name: "Science & Education",
    feeds: [
      {
        title: "NASA Breaking News",
        url: "https://www.nasa.gov/rss/dyn/breaking_news.rss",
      },
      { title: "Nature", url: "https://www.nature.com/nature.rss" },
      {
        title: "Scientific American",
        url: "https://www.scientificamerican.com/feed/",
      },
      {
        title: "Smithsonian Magazine",
        url: "https://www.smithsonianmag.com/rss/",
      },
      {
        title: "TED Talks Daily",
        url: "https://feeds.feedburner.com/tedtalks_video",
      },
      {
        title: "Science Magazine",
        url: "https://www.sciencemag.org/rss/current.xml",
      },
      { title: "Live Science", url: "https://www.livescience.com/feeds/all" },
      { title: "Popular Science", url: "https://www.popsci.com/arcio/rss/" },
      {
        title: "The Conversation",
        url: "https://theconversation.com/us/articles.atom",
      },
      {
        title: "National Geographic",
        url: "https://www.nationalgeographic.com/content/nationalgeographic/en_us/rss",
      },
    ],
  },
  {
    name: "WordPress & Web Development",
    feeds: [
      { title: "WordPress.org Blog", url: "https://wordpress.org/news/feed/" },
      {
        title: "Smashing Magazine",
        url: "https://www.smashingmagazine.com/feed/",
      },
      { title: "CSS-Tricks", url: "https://css-tricks.com/feed/" },
      { title: "SitePoint", url: "https://www.sitepoint.com/feed/" },
      { title: "WP Mayor", url: "https://wpmayor.com/feed/" },
    ],
  },
];
