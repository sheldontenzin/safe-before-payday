import { BagelIcon, JournalIcon, SneakersIcon, TeaIcon } from "@/components/icons";

type Pillar = {
  title: string;
  description: string;
};

type ChannelPillarsCarouselProps = {
  pillars: readonly Pillar[];
};

const iconMap = [
  JournalIcon,
  SneakersIcon,
  TeaIcon,
  BagelIcon,
  JournalIcon
];

function PillarCard({
  pillar,
  index
}: {
  pillar: Pillar;
  index: number;
}) {
  const Icon = iconMap[index % iconMap.length];

  return (
    <article className="pillar-marquee-card cursor-default">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex items-center rounded-full border border-[#dec8b2] bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-caramel">
          {String(index + 1).padStart(2, "0")}
        </span>
        <Icon className="h-11 w-11 border-[#ead9c8] bg-[#fffaf4] shadow-none" />
      </div>

      <div className="mt-8 space-y-3">
        <h3 className="text-2xl leading-tight text-ink">{pillar.title}</h3>
        <p className="text-sm leading-7 text-smoke sm:text-base">
          {pillar.description}
        </p>
      </div>
    </article>
  );
}

export function ChannelPillarsCarousel({
  pillars
}: ChannelPillarsCarouselProps) {
  return (
    <div className="pillar-marquee" aria-label="Channel pillars">
      <div className="pillar-marquee-track">
        {pillars.map((pillar, index) => (
          <PillarCard key={`${pillar.title}-primary`} pillar={pillar} index={index} />
        ))}
        <div className="contents" aria-hidden="true">
          {pillars.map((pillar, index) => (
            <PillarCard
              key={`${pillar.title}-duplicate`}
              pillar={pillar}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
