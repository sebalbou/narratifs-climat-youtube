import type { ReactNode } from "react";
import type { Aggregates } from "../types";
import {
  COMMENT_CLIMATE_LABELS,
  NARRATIVE_COLORS,
  NARRATIVE_DEFINITIONS,
  NARRATIVE_LABELS,
  NARRATIVE_ORDER,
  formatInt,
  formatViews,
} from "../constants";

// Chiffres de l'entonnoir non présents dans aggregates.json (mesurés sur
// data/videos_classified.json et kappa/ au moment de la rédaction).
const SEARCH_QUERIES_CONSENSUS = [
  "changement climatique",
  "réchauffement climatique",
  "crise climatique",
  "transition écologique",
  "rapport GIEC",
];
const SEARCH_QUERIES_SKEPTIC = ["arnaque climatique", "écologie punitive"];
const CLIMATE_KEYWORDS_SAMPLE = [
  "climat",
  "GIEC",
  "carbone",
  "canicule",
  "éolien",
  "renouvelable",
  "sobriété",
  "ZFE",
  "greenwashing",
  "effondrement",
];
const SEARCH_VIDEOS = 3_000;
const CRAWLED_CHANNELS = 2_035;
const SEED_CHANNELS = 7;
const UPLOADS_PER_CHANNEL = 400;
const TOP_ANALYZED = 5_000;
const TOP_VIEWS_PCT = 88;
const EXCLUDED_NON_FR = 1_220;
const EXCLUDED_OFF_TOPIC = 1_565;
const TRANSCRIPT_VIEWS_PCT = 66;
const KAPPA_SAMPLE = 104;
const KAPPA_VALUE = "0,44";
const KAPPA_AGREEMENT_PCT = 52;
const COMMENT_SECTIONS = 755;
const COMMENTS_PER_VIDEO = 30;
const COMMENTS_TOTAL = 21_000;

const REPO_URL = "https://github.com/sebalbou/narratifs-climat-youtube";

export default function Methode({ data }: { data: Aggregates }) {
  const { meta } = data;

  const steps: FunnelStep[] = [
    {
      title: "Chercher comme un internaute",
      count: `≈ ${formatInt(SEARCH_VIDEOS)}`,
      unit: "vidéos",
      width: 18,
      body: (
        <>
          YouTube ne fournit pas de liste « de toutes les vidéos qui parlent de
          climat ». On part donc de la recherche, depuis la France et en
          français : {SEARCH_QUERIES_CONSENSUS.length} requêtes neutres
          <QueryList items={SEARCH_QUERIES_CONSENSUS} /> et{" "}
          {SEARCH_QUERIES_SKEPTIC.length} requêtes volontairement sceptiques
          <QueryList items={SEARCH_QUERIES_SKEPTIC} tone="skeptic" /> pour ne pas
          pêcher d'un seul côté. Chaque requête est rejouée par tranches de 4 mois
          sur 2 ans, triée par pertinence puis par date, pour que la dernière
          canicule n'écrase pas tout le reste.
        </>
      ),
    },
    {
      title: "Fouiller les chaînes trouvées",
      count: formatInt(meta.total_videos_collected),
      unit: "vidéos",
      width: 100,
      body: (
        <>
          Pour chaque chaîne remontée par ces recherches, plus{" "}
          {SEED_CHANNELS} chaînes climatosceptiques ajoutées à la main (peu
          visibles dans la recherche), on parcourt ses {UPLOADS_PER_CHANNEL}{" "}
          dernières vidéos et on garde celles dont le titre ou la description
          contient un mot du sujet (
          {CLIMATE_KEYWORDS_SAMPLE.join(", ")}…). Soit{" "}
          {formatInt(CRAWLED_CHANNELS)} chaînes fouillées.
        </>
      ),
    },
    {
      title: "Garder ce qui est vu",
      count: formatInt(TOP_ANALYZED),
      unit: "vidéos",
      width: 30,
      body: (
        <>
          L'audience est très concentrée : les {formatInt(TOP_ANALYZED)} vidéos
          les plus vues totalisent {TOP_VIEWS_PCT} % des vues du corpus. C'est là
          que porte l'analyse.
        </>
      ),
    },
    {
      title: "Faire lire chaque vidéo par une IA",
      count: formatInt(meta.total_videos_classified),
      unit: `vidéos · ${formatViews(meta.total_views)} de vues`,
      width: 14,
      highlight: true,
      body: (
        <>
          Un modèle de langage lit le titre, la description et le début de la
          transcription quand YouTube la fournit (c'est le cas pour{" "}
          {TRANSCRIPT_VIEWS_PCT} % des vues), puis répond à deux questions :
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>
              <strong>Le climat est-il vraiment le sujet</strong>, ou une simple
              accroche ? → {formatInt(EXCLUDED_OFF_TOPIC)} vidéos écartées
              (chaînes généralistes qui citent une canicule en passant…), ainsi
              que {formatInt(EXCLUDED_NON_FR)} vidéos qui ne sont pas en
              français.
            </li>
            <li>
              <strong>Quel message domine ?</strong> → un des 7 narratifs
              ci-dessous.
            </li>
          </ol>
        </>
      ),
    },
    {
      title: "Pondérer par l'audience",
      width: 14,
      highlight: true,
      body: (
        <>
          Chaque vidéo pèse son nombre de vues : une vidéo vue 2 millions de fois
          compte 1 000 fois plus qu'une vidéo vue 2 000 fois. On mesure ainsi ce
          à quoi le public est <em>exposé</em>, pas seulement ce qui est{" "}
          <em>produit</em>.
        </>
      ),
    },
  ];

  return (
    <section className="max-w-3xl">
      <h2 className="text-lg font-semibold text-stone-900">
        Comment ces chiffres sont-ils produits ?
      </h2>
      <p className="text-sm text-stone-600 mt-1 leading-relaxed">
        La méthode en cinq étapes, comme un entonnoir : ratisser large, puis ne
        garder que les vidéos réellement vues et réellement consacrées au climat.
      </p>

      {/* Entonnoir */}
      <ol className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <Step key={s.title} index={i + 1} step={s} />
        ))}
      </ol>

      {/* Taxonomie */}
      <h3 className="text-base font-semibold text-stone-900 mt-10 mb-1">
        Les 7 narratifs
      </h3>
      <p className="text-sm text-stone-500 mb-3">
        Chaque vidéo reçoit un seul narratif : celui qui porte l'intention
        principale de l'auteur, pas un thème évoqué en passant.
      </p>
      <div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100">
        {NARRATIVE_ORDER.filter((k) => k !== "HORS_SUJET").map((k) => (
          <div key={k} className="flex gap-3 px-4 py-2.5 text-sm">
            <span
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: NARRATIVE_COLORS[k] }}
            />
            <div>
              <span className="font-medium text-stone-900">
                {NARRATIVE_LABELS[k]}
              </span>
              <span className="text-stone-600"> — {NARRATIVE_DEFINITIONS[k]}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-stone-500 mt-3 leading-relaxed">
        La distinction clé : <strong>Critique de l'inaction</strong> et{" "}
        <strong>Opposition à l'écologie</strong> critiquent toutes deux, mais
        l'une réclame <em>plus</em> d'écologie et l'autre <em>moins</em>.{" "}
        <strong>Scepticisme</strong> conteste la science elle-même ;{" "}
        <strong>Opposition à l'écologie</strong> conteste les politiques menées en
        son nom.
      </p>

      {/* Commentaires */}
      <h3 className="text-base font-semibold text-stone-900 mt-10 mb-1">
        Les commentaires (onglet Audience)
      </h3>
      <p className="text-sm text-stone-600 leading-relaxed">
        Une vidéo pédagogique peut récolter des commentaires hostiles. Pour{" "}
        {formatInt(COMMENT_SECTIONS)} vidéos parmi les plus vues, on récupère les{" "}
        {COMMENTS_PER_VIDEO} commentaires que YouTube met en avant (soit ≈{" "}
        {formatInt(COMMENTS_TOTAL)} commentaires), et l'IA qualifie le climat
        général de la section :{" "}
        {Object.values(COMMENT_CLIMATE_LABELS)
          .map((l) => l.toLowerCase())
          .join(", ")}
        . Critiquer une éolienne au nom de la biodiversité ou reprocher à l'État
        sa mauvaise gestion des canicules n'est <em>pas</em> compté comme
        hostile à l'écologie.
      </p>

      {/* Validation */}
      <h3 className="text-base font-semibold text-stone-900 mt-10 mb-1">
        L'IA est-elle fiable ?
      </h3>
      <div className="grid sm:grid-cols-3 gap-3 my-3">
        <MiniStat value={formatInt(KAPPA_SAMPLE)} label="vidéos codées à la main, à l'aveugle" />
        <MiniStat value={`κ = ${KAPPA_VALUE}`} label="kappa de Cohen humain ↔ IA" />
        <MiniStat value={`${KAPPA_AGREEMENT_PCT} %`} label="d'accord exact sur 7 catégories" />
      </div>
      <p className="text-sm text-stone-600 leading-relaxed">
        Un échantillon de 15 vidéos par narratif a été classé par un humain sans
        voir la réponse de l'IA, puis comparé. L'accord est{" "}
        <strong>modéré</strong> (le kappa corrige l'accord dû au hasard ; 0 =
        hasard, 1 = accord parfait). Les désaccords portent surtout sur des
        catégories voisines, <em>Science</em> ↔ <em>Solutions</em> et{" "}
        <em>Urgence</em> ↔ <em>Critique de l'inaction</em>, et rarement sur des
        contresens du type « sceptique » ↔ « alarmiste ». Des règles de
        tranchement tirées de ces désaccords ont été ajoutées aux instructions de
        l'IA. Les chiffres agrégés sont à lire comme des ordres de grandeur,
        avec une marge d'erreur.
      </p>

      {/* Limites */}
      <h3 className="text-base font-semibold text-stone-900 mt-10 mb-2">
        Ce que ça ne mesure pas
      </h3>
      <ul className="text-sm text-stone-600 leading-relaxed space-y-2 list-disc ml-5">
        <li>
          <strong>Pas tout YouTube</strong> : seulement les vidéos atteignables
          depuis ces {SEARCH_QUERIES_CONSENSUS.length + SEARCH_QUERIES_SKEPTIC.length}{" "}
          recherches et ces chaînes. Une grande chaîne qu'aucune recherche n'a
          fait remonter est absente.
        </li>
        <li>
          <strong>Pas les recommandations</strong> : on ne sait pas ce que
          l'algorithme pousse à chacun, seulement ce qui a été vu au total.
        </li>
        <li>
          <strong>Pas l'audience récente</strong> : les vues s'additionnent depuis
          la publication, une vidéo de 2019 a eu plus de temps pour en accumuler.
        </li>
        <li>
          <strong>Pas les personnes</strong> : 1 000 vues ne font pas 1 000
          spectateurs distincts, et l'API publique ne dit rien de leur profil.
        </li>
        <li>
          <strong>Une part de publicité</strong> : {meta.institutional_views_pct ?? 0}{" "}
          % des vues viennent de chaînes institutionnelles ou d'annonceurs
          (Enedis, ministères…) dont la visibilité est achetée. Le filtre en haut
          de page permet de les exclure.
        </li>
      </ul>

      <p className="text-sm text-stone-500 mt-8 pt-4 border-t border-stone-200">
        Code, données et protocole de validation en open source :{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="text-stone-800 underline underline-offset-2 hover:text-stone-950"
        >
          github.com/sebalbou/narratifs-climat-youtube
        </a>
      </p>
    </section>
  );
}

type FunnelStep = {
  title: string;
  count?: string;
  unit?: string;
  width: number; // largeur relative de la barre (échelle visuelle, non linéaire)
  highlight?: boolean;
  body: ReactNode;
};

function Step({ index, step }: { index: number; step: FunnelStep }) {
  return (
    <li className="bg-white border border-stone-200 rounded-lg p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xs font-semibold text-stone-400 tabular-nums">
          {index}
        </span>
        <h3 className="text-base font-semibold text-stone-900">{step.title}</h3>
        {step.count && (
          <span className="ml-auto text-sm text-stone-500 tabular-nums">
            <strong
              className={step.highlight ? "text-stone-900 text-base" : "text-stone-800"}
            >
              {step.count}
            </strong>{" "}
            {step.unit}
          </span>
        )}
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${step.highlight ? "bg-stone-800" : "bg-stone-400"}`}
          style={{ width: `${step.width}%` }}
        />
      </div>
      <div className="mt-3 text-sm text-stone-600 leading-relaxed">{step.body}</div>
    </li>
  );
}

function QueryList({ items, tone }: { items: string[]; tone?: "skeptic" }) {
  return (
    <span className="inline-flex flex-wrap gap-1 mx-1 align-middle">
      {items.map((q) => (
        <span
          key={q}
          className={`rounded px-1.5 py-0.5 text-xs ${
            tone === "skeptic"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-stone-100 text-stone-700 border border-stone-200"
          }`}
        >
          {q}
        </span>
      ))}
    </span>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg px-4 py-3">
      <div className="text-xl font-semibold text-stone-900 tabular-nums">{value}</div>
      <div className="text-xs text-stone-500 mt-0.5 leading-snug">{label}</div>
    </div>
  );
}
