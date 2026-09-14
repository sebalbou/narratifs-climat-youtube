import type { ReactNode } from "react";
import type { Aggregates, NarrativeKey } from "../types";
import { NARRATIVE_COLORS, NARRATIVE_LABELS, formatInt, formatViews } from "../constants";

// Chiffres de méthode non présents dans aggregates.json, mesurés sur
// data/videos_classified.json et kappa/ (méthode figée au 14/09/2026).
// À mettre à jour à la main si le pipeline est relancé.
const SEARCH_QUERIES = [
  "changement climatique",
  "réchauffement climatique",
  "crise climatique",
  "transition écologique",
  "rapport GIEC",
];
const SKEPTIC_QUERIES = ["arnaque climatique", "écologie punitive"];
const CRAWLED_CHANNELS = 2_035;
const EXCLUDED_OFF_TOPIC = 1_565;
const EXCLUDED_NON_FR = 1_220;
// Part des vues selon ce que l'IA a pu lire (transcript tronqué à 1 500 mots).
const READ_FULL_PCT = 36;
const READ_PARTIAL_PCT = 30;
const READ_NONE_PCT = 34;
// Vérification humaine : 104 vidéos codées à l'aveugle, dont 13 jugées
// hors sujet par l'IA mises de côté (option absente du codage humain).
const CHECK_SAME = 54;
const CHECK_NEAR = 30;
const CHECK_OPPOSITE = 7;
const CHECK_OFF_TOPIC = 13;
const COMMENT_SECTIONS = 755;
const COMMENTS_PER_VIDEO = 30;

const DEFENDS: { key: NarrativeKey; hint: string }[] = [
  { key: "SCIENCE_PEDAGOGIE", hint: "explique les mécanismes, les données, le GIEC" },
  { key: "SOLUTIONS_TECHNO", hint: "renouvelables, sobriété, innovation" },
  { key: "URGENCE_MOBILISATION", hint: "crise grave, il faut agir vite" },
  { key: "CRITIQUE_INACTION", hint: "réclame plus : gouvernements, greenwashing" },
  { key: "ANXIETE_EFFONDREMENT", hint: "collapsologie, fatalisme" },
];
const CONTESTS: { key: NarrativeKey; hint: string }[] = [
  { key: "OPPOSITION_ECOLOGIE", hint: "conteste les mesures : écologie punitive, ZFE" },
  { key: "SCEPTICISME_MINIMISATION", hint: "conteste la science : gravité, origine humaine" },
];
// Ordre de la barre de résultat : camp « défend » puis camp « conteste ».
const BAR_ORDER = [...DEFENDS, ...CONTESTS].map((n) => n.key);

const COMMENT_PILLS: { label: string; hostile?: boolean }[] = [
  { label: "adhésion à la science" },
  { label: "critique de la méthode" },
  { label: "colère contre l'inaction" },
  { label: "scepticisme", hostile: true },
  { label: "hostilité à l'écologie", hostile: true },
  { label: "complotisme", hostile: true },
  { label: "mixte" },
];

const REPO_URL = "https://github.com/sebalbou/narratifs-climat-youtube";

export default function Methode({ data }: { data: Aggregates }) {
  const { meta, narratives } = data;
  const views = (k: NarrativeKey) => narratives[k]?.views ?? 0;
  const totalViews = BAR_ORDER.reduce((s, k) => s + views(k), 0) || 1;
  const defendsViews = DEFENDS.reduce((s, n) => s + views(n.key), 0);
  const defendsPct = Math.round((1000 * defendsViews) / totalViews) / 10;
  const contestsPct = Math.round((1000 - 10 * defendsPct)) / 10;
  const pct = (x: number) => `${x.toLocaleString("fr-FR")} %`;
  const collected = meta.total_videos_collected ?? 0;
  const topAnalyzed = meta.total_videos_classified + EXCLUDED_OFF_TOPIC + EXCLUDED_NON_FR;
  const agreeTotal = CHECK_SAME + CHECK_NEAR + CHECK_OPPOSITE;

  return (
    <section className="space-y-14">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">
          Comment ces chiffres sont-ils produits ?
        </h2>
        <p className="text-sm text-stone-500 mt-1 max-w-2xl">
          On ratisse large, puis on ne garde que les vidéos réellement vues et
          réellement consacrées au climat.
        </p>
      </div>

      {/* 1. Étapes */}
      <div>
        <SectionHead
          eyebrow="De YouTube au tableau de bord"
          title="Élargir, puis filtrer"
        >
          Tout est automatisé. Un programme interroge YouTube par son{" "}
          <strong className="text-stone-700">API</strong>, le guichet que YouTube
          ouvre aux logiciels pour leur partager ses données : on lui envoie des
          mots-clés, il renvoie la liste des vidéos avec leur titre, leur
          description et leur nombre de vues. Personne ne regarde les vidéos, ni
          un humain ni l'IA : tout le travail se fait sur ces textes et ces
          chiffres.
        </SectionHead>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)_28px_minmax(0,1fr)_28px_minmax(0,1fr)]">
          <Step n={1} title="Chercher comme un internaute" count="≈ 3 000" unit="vidéos">
            <p>
              7 recherches envoyées à l'API, réglées sur la France et le français,
              comme les taperait un internaute. Deux sont volontairement
              sceptiques, pour ne pas pêcher d'un seul côté.
            </p>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
                Les 7 recherches lancées
              </div>
              <div className="flex flex-wrap gap-1">
                {SEARCH_QUERIES.map((q) => (
                  <Chip key={q}>{q}</Chip>
                ))}
                {SKEPTIC_QUERIES.map((q) => (
                  <Chip key={q} skeptic>
                    {q}
                  </Chip>
                ))}
              </div>
            </div>
          </Step>
          <Arrow />
          <Step
            n={2}
            title="Fouiller les chaînes trouvées"
            count={formatInt(collected)}
            unit="vidéos"
            delta={[{ text: `+ ≈ ${formatInt(Math.round((collected - 3_000) / 1000) * 1000)} vidéos des mêmes chaînes`, plus: true }]}
          >
            <p>
              Les recherches ne remontent qu'une partie des vidéos. On parcourt
              donc les {formatInt(CRAWLED_CHANNELS)} chaînes trouvées (dont 7
              chaînes sceptiques ajoutées à la main) et on garde les vidéos dont
              le titre ou la description parle du sujet : climat, GIEC, canicule,
              ZFE…
            </p>
          </Step>
          <Arrow />
          <Step
            n={3}
            title="Garder les plus vues"
            count="≈ 5 000"
            unit="vidéos · 88 % des vues"
            delta={[
              { text: `− ≈ ${formatInt(Math.round((collected - topAnalyzed) / 1000) * 1000)} vidéos peu vues` },
              { text: "(12 % des vues à elles toutes)" },
            ]}
          >
            <p>
              On trie les vidéos par nombre de vues, fourni par l'API. L'audience
              est très concentrée : une poignée de vidéos fait l'essentiel des
              vues, les autres pèsent trop peu pour changer le résultat.
            </p>
          </Step>
          <Arrow />
          <Step
            n={4}
            title="Faire trier par l'IA"
            count={formatInt(meta.total_videos_classified)}
            unit="vidéos retenues"
            delta={[
              { text: `− ${formatInt(EXCLUDED_OFF_TOPIC)} hors sujet` },
              { text: `− ${formatInt(EXCLUDED_NON_FR)} pas en français` },
            ]}
          >
            <p>
              L'IA lit le titre, la description et les sous-titres de chaque vidéo
              (détail ci-dessous). Elle écarte celles où le climat n'est qu'une
              accroche (une chaîne généraliste qui cite la canicule en passant) et
              celles qui ne sont pas en français.
            </p>
          </Step>
        </div>

        <Arrow down />

        <div className="bg-white border border-stone-200 rounded-lg p-4 grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)] md:items-center">
          <div>
            <StepHeader n={5} title="Pondérer par l'audience" />
            <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-stone-900">
              {formatViews(meta.total_views)}
              <span className="block text-xs font-medium text-stone-500 tracking-normal mt-0.5">
                de vues
              </span>
            </div>
            <p className="mt-2 text-[13px] text-stone-600 leading-relaxed">
              Chaque vidéo pèse son nombre de vues : une vidéo vue 2 millions de
              fois compte 1 000 fois plus qu'une vidéo vue 2 000 fois. On mesure ce
              que le public voit, pas seulement ce qui est produit.
            </p>
          </div>
          <div>
            <div
              className="flex h-8 rounded overflow-hidden"
              role="img"
              aria-label={`Part des vues par narratif : ${pct(defendsPct)} défend la science ou l'action, ${pct(contestsPct)} la conteste`}
            >
              {BAR_ORDER.map((k) => (
                <div
                  key={k}
                  title={`${NARRATIVE_LABELS[k]} : ${pct(Math.round((1000 * views(k)) / totalViews) / 10)}`}
                  style={{ flex: views(k), backgroundColor: NARRATIVE_COLORS[k] }}
                />
              ))}
            </div>
            <div className="flex mt-1.5 text-[11.5px] font-semibold text-stone-500 tabular-nums">
              <span
                className="text-right pr-2 border-r-[1.5px] border-stone-900"
                style={{ flex: defendsPct }}
              >
                {pct(defendsPct)} défend la science ou l'action
              </span>
              <span className="pl-2 whitespace-nowrap" style={{ flex: contestsPct }}>
                {pct(contestsPct)} conteste
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ce que l'IA lit */}
      <div>
        <SectionHead
          eyebrow="Étape « Faire trier par l'IA »"
          title="Ce que l'IA lit pour chaque vidéo"
        >
          L'IA ne voit pas la vidéo : ni les images, ni le ton, ni la musique.
          Elle ne lit que du texte : le titre, la description et, quand YouTube
          les fournit, les sous-titres (la transcription de ce qui est dit).
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-start">
          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden" aria-hidden="true">
            <div
              className="aspect-[16/7] max-w-full grid place-items-center text-xs text-stone-400"
              style={{
                background:
                  "repeating-linear-gradient(135deg, #f5f5f4 0 10px, #efeeec 10px 20px)",
              }}
            >
              <span>
                <span className="line-through">images, voix, musique</span> · non analysées
              </span>
            </div>
            <div className="px-4 py-3.5 grid gap-2.5 text-[12.5px]">
              <ReadRow label="Titre">
                <div className="h-2 rounded bg-stone-900" style={{ width: "70%" }} />
              </ReadRow>
              <ReadRow label="Description">
                <div className="h-2 rounded bg-stone-900" style={{ width: "92%" }} />
              </ReadRow>
              <ReadRow label="Sous-titres">
                <div className="flex h-2 rounded overflow-hidden">
                  <div className="bg-stone-900" style={{ width: "48%" }} />
                  <div className="bg-stone-200" style={{ width: "52%" }} />
                </div>
              </ReadRow>
            </div>
          </div>
          <div className="bg-white border border-stone-200 rounded-lg p-4">
            <h4 className="text-[13px] font-semibold text-stone-900 mb-3">
              Part des vues selon ce que l'IA a pu lire
            </h4>
            <div className="flex h-9 rounded-md overflow-hidden gap-0.5 text-[13px] font-semibold tabular-nums">
              <div className="flex items-center px-2.5 bg-stone-900 text-white" style={{ flex: READ_FULL_PCT }}>
                {READ_FULL_PCT} %
              </div>
              <div className="flex items-center px-2.5 bg-stone-500 text-white" style={{ flex: READ_PARTIAL_PCT }}>
                {READ_PARTIAL_PCT} %
              </div>
              <div className="flex items-center px-2.5 bg-stone-300 text-stone-900" style={{ flex: READ_NONE_PCT }}>
                {READ_NONE_PCT} %
              </div>
            </div>
            <div className="grid gap-2 mt-3.5 text-[12.5px] text-stone-600">
              <Legend swatch="bg-stone-900" value={READ_FULL_PCT}>
                sous-titres lus en entier
              </Legend>
              <Legend swatch="bg-stone-500" value={READ_PARTIAL_PCT}>
                sous-titres lus en partie (vidéos longues : les 1 500 premiers
                mots, ≈ 10 min)
              </Legend>
              <Legend swatch="bg-stone-300" value={READ_NONE_PCT}>
                pas de sous-titres : titre et description seulement
              </Legend>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Narratifs */}
      <div>
        <SectionHead eyebrow="La grille de lecture" title="7 narratifs, deux camps">
          Chaque vidéo reçoit un seul narratif : celui qui porte l'intention
          principale de l'auteur.
        </SectionHead>
        <div className="grid gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,2.3fr)]">
          <Camp title="Défend la science ou l'action" share={pct(defendsPct) + " des vues"} items={DEFENDS} />
          <Camp title="La conteste" share={pct(contestsPct)} items={CONTESTS} contest />
        </div>
      </div>

      {/* 4. Vérification */}
      <div>
        <SectionHead eyebrow="Contrôle qualité" title="L'IA a-t-elle bien classé ?">
          Un humain a classé lui-même des vidéos, sans voir la réponse de l'IA.
          Puis on a comparé.
        </SectionHead>
        <div className="bg-white border border-stone-200 rounded-lg p-5 grid gap-7 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: "repeat(13, 14px)" }}
            role="img"
            aria-label={`${agreeTotal} vidéos : ${CHECK_SAME} même narratif, ${CHECK_NEAR} narratif voisin du même camp, ${CHECK_OPPOSITE} camps opposés`}
          >
            {[
              ...Array(CHECK_SAME).fill("bg-stone-900"),
              ...Array(CHECK_NEAR).fill("bg-stone-400"),
              ...Array(CHECK_OPPOSITE).fill("bg-red-700"),
            ].map((cls, i) => (
              <span key={i} className={`block w-3.5 h-3.5 rounded-[3px] ${cls}`} />
            ))}
          </div>
          <div className="grid gap-3.5">
            <p className="text-[17px] font-semibold leading-snug text-stone-900 max-w-xl">
              Sur 10 vidéos, l'humain et l'IA les rangent 9 fois dans le même camp,
              et 6 fois exactement dans la même case.
            </p>
            <div className="grid gap-1.5 text-[13px] text-stone-600 tabular-nums">
              <Legend swatch="bg-stone-900" label={CHECK_SAME}>même narratif</Legend>
              <Legend swatch="bg-stone-400" label={CHECK_NEAR}>narratif voisin, même camp</Legend>
              <Legend swatch="bg-red-700" label={CHECK_OPPOSITE}>camps opposés</Legend>
            </div>
            <p className="text-[12.5px] text-stone-500 border-l-2 border-stone-200 pl-2.5 max-w-xl">
              Les écarts sont surtout des cas limites : une vidéo qui explique le
              rapport du GIEC en sonnant l'alarme, c'est de la pédagogie ou de
              l'urgence ?
            </p>
            <p className="text-xs text-stone-400">
              {agreeTotal} vidéos comparées. {CHECK_OFF_TOPIC} autres, que l'IA a
              jugées hors sujet, sont mises de côté : l'humain n'avait pas cette
              option.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Commentaires */}
      <div>
        <SectionHead eyebrow="Onglet Audience" title="Et les commentaires ?">
          Une vidéo pédagogique peut récolter des commentaires hostiles. On mesure
          donc aussi la réaction du public.
        </SectionHead>
        <div className="flex flex-wrap items-stretch gap-2">
          <FlowNode value={formatInt(COMMENT_SECTIONS)}>vidéos parmi les plus vues</FlowNode>
          <span className="self-center text-stone-400 text-lg" aria-hidden="true">→</span>
          <FlowNode value={String(COMMENTS_PER_VIDEO)}>
            commentaires mis en avant par YouTube pour chacune (≈ 21 000)
          </FlowNode>
          <span className="self-center text-stone-400 text-lg" aria-hidden="true">→</span>
          <div className="bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 flex-[2_1_260px] text-[12.5px] text-stone-500">
            L'IA qualifie l'ambiance de la section :
            <div className="flex flex-wrap gap-1 mt-1.5">
              {COMMENT_PILLS.map((p) => (
                <span
                  key={p.label}
                  className={`text-[11.5px] px-2 rounded-full border ${
                    p.hostile
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-stone-200 bg-stone-100 text-stone-700"
                  }`}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-stone-500 pt-4 border-t border-stone-200">
        Code, données et protocole de vérification en open source :{" "}
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

function SectionHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 grid gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
        {eyebrow}
      </span>
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      {children && (
        <p className="text-sm text-stone-500 max-w-2xl leading-relaxed">{children}</p>
      )}
    </div>
  );
}

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[22px] h-[22px] shrink-0 rounded-full bg-stone-900 text-white text-xs font-semibold grid place-items-center">
        {n}
      </span>
      <h4 className="text-[13.5px] font-semibold leading-tight text-stone-900">{title}</h4>
    </div>
  );
}

function Step({
  n,
  title,
  count,
  unit,
  delta,
  children,
}: {
  n: number;
  title: string;
  count: string;
  unit: string;
  delta?: { text: string; plus?: boolean }[];
  children: ReactNode;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-3.5 pb-3 flex flex-col gap-2">
      <StepHeader n={n} title={title} />
      <div className="text-2xl font-bold tracking-tight leading-none tabular-nums text-stone-900">
        {count}
        <span className="block text-xs font-medium text-stone-500 tracking-normal mt-1">{unit}</span>
      </div>
      <div className="text-[12.5px] text-stone-600 leading-relaxed grid gap-2">{children}</div>
      {delta && (
        <div className="mt-auto pt-2 border-t border-stone-200 grid gap-0.5 text-xs font-medium text-stone-500 tabular-nums">
          {delta.map((d) => (
            <span key={d.text} className={d.plus ? "text-[#4a7c59]" : undefined}>
              {d.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <div
      className={`grid place-items-center text-stone-400 ${down ? "h-9" : "h-8 lg:h-auto"}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 20 20"
        className={`w-5 h-5 ${down ? "rotate-90" : "rotate-90 lg:rotate-0"}`}
      >
        <path
          d="M3 10h12M10.5 5.5 15 10l-4.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Chip({ children, skeptic = false }: { children: ReactNode; skeptic?: boolean }) {
  return (
    <span
      className={`text-[11px] leading-[18px] px-1.5 rounded border whitespace-nowrap ${
        skeptic
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-stone-100 border-stone-200 text-stone-700"
      }`}
    >
      {children}
    </span>
  );
}

function ReadRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2.5 items-center">
      <span className="text-stone-500">{label}</span>
      {children}
    </div>
  );
}

function Legend({
  swatch,
  value,
  label,
  children,
}: {
  swatch: string;
  value?: number;
  label?: number;
  children: ReactNode;
}) {
  return (
    <div className={`grid ${value !== undefined ? "grid-cols-[12px_40px_1fr]" : "grid-cols-[14px_1fr]"} gap-2 items-baseline`}>
      <span className={`block w-3 h-3 rounded-[3px] self-center ${swatch}`} />
      {value !== undefined && <span className="tabular-nums">{value} %</span>}
      <span>
        {label !== undefined && <b className="text-stone-900">{label} </b>}
        {children}
      </span>
    </div>
  );
}

function Camp({
  title,
  share,
  items,
  contest = false,
}: {
  title: string;
  share: string;
  items: { key: NarrativeKey; hint: string }[];
  contest?: boolean;
}) {
  return (
    <div
      className="border-t-[3px] pt-3"
      style={{ borderTopColor: contest ? NARRATIVE_COLORS.OPPOSITION_ECOLOGIE : "#1c1917" }}
    >
      <h4 className="flex justify-between gap-2 text-[13px] font-semibold text-stone-900 mb-2.5">
        {title}
        <span className="font-medium text-stone-500 tabular-nums">{share}</span>
      </h4>
      <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        {items.map(({ key, hint }) => (
          <div key={key} className="grid grid-cols-[10px_1fr] gap-2 text-[12.5px] text-stone-500">
            <span
              className="w-2.5 h-2.5 rounded-full mt-1"
              style={{ backgroundColor: NARRATIVE_COLORS[key] }}
            />
            <div>
              <b className="block text-[13px] font-semibold text-stone-900">
                {NARRATIVE_LABELS[key]}
              </b>
              {hint}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowNode({ value, children }: { value: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 flex-[1_1_150px] min-w-0">
      <b className="block text-lg font-bold tabular-nums text-stone-900">{value}</b>
      <span className="text-[12.5px] text-stone-500">{children}</span>
    </div>
  );
}
