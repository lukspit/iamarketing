export interface ChannelConfig {
  channelId: string;
  name: string;
  handle: string;
  wave: 1 | 2 | 3;
  language: "en" | "pt";
  maxVideos: number;
}

export interface YouTubeConfig {
  channels: ChannelConfig[];
  keywords: {
    en: string[];
    pt: string[];
  };
  scoring: {
    viewWeight: number;
    recencyWeight: number;
    relevanceWeight: number;
  };
  defaults: {
    maxVideosPerChannel: number;
    minViews: number;
    maxAgeMonths: number;
    topNPerChannel: number;
    minDurationSeconds: number;
  };
}

export const YOUTUBE_CONFIG: YouTubeConfig = {
  channels: [
    // ============================
    // WAVE 1 — Máximo impacto
    // ============================
    {
      channelId: "UCUyDOdBWhC1MCxEjC46d-zw",
      name: "Alex Hormozi",
      handle: "@AlexHormozi",
      wave: 1,
      language: "en",
      maxVideos: 50,
    },
    {
      channelId: "UC2qUDKqTsz00csykCYgdLuA",
      name: "Russell Brunson",
      handle: "@RussellBrunson",
      wave: 1,
      language: "en",
      maxVideos: 50,
    },
    {
      channelId: "UCPEZnYBqewx-h43B5tLymYw",
      name: "Alex Cattoni",
      handle: "@AlexCattoni",
      wave: 1,
      language: "en",
      maxVideos: 40,
    },

    // ============================
    // WAVE 2 — Profundidade
    // ============================
    {
      channelId: "UCQ5mWx_XYGRbpcV8zjGhorg",
      name: "Jeremy Miner",
      handle: "@JeremyMiner",
      wave: 2,
      language: "en",
      maxVideos: 30,
    },
    {
      channelId: "UCWquNQV8Y0_defMKnGKrFOQ",
      name: "Ahrefs",
      handle: "@AhrefsCom",
      wave: 2,
      language: "en",
      maxVideos: 40,
    },
    {
      channelId: "UC6t1O76G0jYXOAoYCm153dA",
      name: "Lenny Rachitsky",
      handle: "@LennysPodcast",
      wave: 2,
      language: "en",
      maxVideos: 30,
    },
    // Wave 2 — BR
    {
      channelId: "UCPkWR3YeOc2YDpTws-zsFEA",
      name: "Leandro Ladeira",
      handle: "@leandroladeira",
      wave: 2,
      language: "pt",
      maxVideos: 40,
    },
    {
      channelId: "UC4ovz3ObT9fffGjJjVKFGDQ",
      name: "Pedro Sobral",
      handle: "@pedrosobral",
      wave: 2,
      language: "pt",
      maxVideos: 40,
    },
    {
      channelId: "UC6uW_d0S7a4C7vPvnrMBpyA",
      name: "Icaro de Carvalho (O Novo Mercado)",
      handle: "@onovomercado",
      wave: 2,
      language: "pt",
      maxVideos: 40,
    },

    // ============================
    // WAVE 3 — Completude (adicionar mais conforme necessário)
    // ============================
    {
      channelId: "",
      name: "Leila Hormozi",
      handle: "@LeilaHormozi",
      wave: 3,
      language: "en",
      maxVideos: 30,
    },
    {
      channelId: "",
      name: "Codie Sanchez",
      handle: "@CodieSanchez",
      wave: 3,
      language: "en",
      maxVideos: 30,
    },
    {
      channelId: "",
      name: "Ben Heath",
      handle: "@BenHeath",
      wave: 3,
      language: "en",
      maxVideos: 30,
    },
    {
      channelId: "",
      name: "Chase Dimond",
      handle: "@ChaseDimond",
      wave: 3,
      language: "en",
      maxVideos: 30,
    },
    {
      channelId: "",
      name: "Chris Voss",
      handle: "@ChrisVoss",
      wave: 3,
      language: "en",
      maxVideos: 30,
    },
    {
      channelId: "",
      name: "The Futur",
      handle: "@TheFutur",
      wave: 3,
      language: "en",
      maxVideos: 30,
    },
    {
      channelId: "",
      name: "Davie Fogarty",
      handle: "@DavieFogarty",
      wave: 3,
      language: "en",
      maxVideos: 30,
    },
    {
      channelId: "",
      name: "Dan Koe",
      handle: "@DanKoe",
      wave: 3,
      language: "en",
      maxVideos: 30,
    },
    {
      channelId: "",
      name: "Erico Rocha",
      handle: "@EricoRocha",
      wave: 3,
      language: "pt",
      maxVideos: 30,
    },
    {
      channelId: "",
      name: "Tiago Tessmann",
      handle: "@TiagoTessmann",
      wave: 3,
      language: "pt",
      maxVideos: 30,
    },
    {
      channelId: "",
      name: "Gustavo Ferreira",
      handle: "@GustavoFerreira",
      wave: 3,
      language: "pt",
      maxVideos: 30,
    },
    {
      channelId: "",
      name: "Conrado Adolpho",
      handle: "@ConradoAdolpho",
      wave: 3,
      language: "pt",
      maxVideos: 30,
    },
  ],

  keywords: {
    en: [
      "marketing",
      "funnel",
      "copywriting",
      "sales",
      "leads",
      "conversion",
      "landing page",
      "email marketing",
      "offer",
      "pricing",
      "ads",
      "facebook ads",
      "google ads",
      "seo",
      "content marketing",
      "branding",
      "customer acquisition",
      "retention",
      "upsell",
      "launch",
      "webinar",
      "vsl",
      "headline",
      "hook",
      "cta",
      "persuasion",
      "scaling",
      "direct response",
      "value ladder",
      "lead magnet",
      "cold outreach",
      "closing",
      "objection",
      "guarantee",
      "testimonial",
      "case study",
    ],
    pt: [
      "marketing",
      "funil",
      "copy",
      "vendas",
      "leads",
      "conversao",
      "pagina de vendas",
      "email marketing",
      "oferta",
      "trafego",
      "anuncios",
      "lancamento",
      "perpetuo",
      "webinario",
      "vsl",
      "headline",
      "gancho",
      "escala",
      "infoproduto",
      "digital",
      "remarketing",
      "publico alvo",
      "persona",
      "roi",
      "cpl",
      "cpa",
      "roas",
      "ticket medio",
      "upsell",
      "downsell",
      "order bump",
    ],
  },

  scoring: {
    viewWeight: 0.4,
    recencyWeight: 0.3,
    relevanceWeight: 0.3,
  },

  defaults: {
    maxVideosPerChannel: 30,
    minViews: 1000,
    maxAgeMonths: 36,
    topNPerChannel: 10,
    minDurationSeconds: 120,
  },
};
