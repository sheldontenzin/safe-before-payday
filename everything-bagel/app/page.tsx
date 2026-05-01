import Image from "next/image";

import { BagelIcon, PaperPlaneIcon, PlayIcon, TeaIcon } from "@/components/icons";
import { ChannelPillarsCarousel } from "@/components/channel-pillars-carousel";
import { ContactForm } from "@/components/contact-form";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { channelPillars } from "@/lib/content";

function ComingSoonCard() {
  return (
    <div className="section-shell grain overflow-hidden p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="space-y-4">
          <span className="eyebrow">YouTube</span>
          <h3 className="text-3xl text-ink sm:text-4xl">Videos coming soon</h3>
          <p className="max-w-xl text-base leading-8 text-smoke sm:text-lg">
            New videos will be shared on YouTube soon — from simple routines
            and movement to honest reflections, parenting thoughts, and
            everyday stories.
          </p>
          <a
            href="https://www.youtube.com/@everything_bagel_diaries"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/85 px-6 py-3 text-base font-semibold text-ink transition-colors hover:border-caramel hover:text-caramel"
          >
            Visit the channel
          </a>
        </div>
        <div className="rounded-[2rem] border border-black/8 bg-[#efe1d1] p-5 shadow-card">
          <div className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white/80">
            <div className="border-b border-black/8 bg-[#fbf4ec] px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2e1cf] text-caramel">
                    <BagelIcon className="h-10 w-10 border-0 bg-transparent shadow-none" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Everything Bagel on YouTube
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-smoke">
                      First upload coming soon
                    </p>
                  </div>
                </div>
                <TeaIcon className="h-10 w-10 border-0 bg-[#fff7ef] shadow-none" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#f7eadb] via-[#f2dfcf] to-[#ead3c0] p-5">
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[1.35rem] border border-black/8 bg-[#e9d4c0]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.5),_transparent_45%)]" />
                <button
                  type="button"
                  aria-label="Coming soon video preview"
                  className="relative flex h-16 w-16 items-center justify-center rounded-full bg-caramel text-white shadow-soft"
                >
                  <PlayIcon />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-1.5 rounded-full bg-black/8">
                  <div className="h-full w-1/3 rounded-full bg-terracotta/70" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-ink">
                    First upload coming soon
                  </p>
                  <p className="text-sm leading-7 text-smoke">
                    A soft preview space for the channel while the first video is
                    still on its way.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="everything-pattern">
      <section className="pb-10 pt-12 sm:pb-12 sm:pt-16">
        <div className="container">
          <div className="mb-10 rounded-full border border-black/6 bg-white/70 px-5 py-3 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-smoke">
              Everything Bagel
            </p>
          </div>

          <div className="max-w-4xl space-y-6">
            <h1 className="text-5xl leading-[1.05] text-ink sm:text-6xl lg:text-7xl">
              A little wellness, a little wisdom, and a little bit of
              everything.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-smoke sm:text-xl">
              Welcome to Everything Bagel, a warm space for routines,
              movement, life reflections, parenting, culture, and everyday
              growth.
            </p>
            <a
              href="https://www.youtube.com/@everything_bagel_diaries"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-caramel px-6 py-3 text-base font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
            >
              Watch on YouTube
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="pb-8 sm:pb-12">
        <div className="container">
          <div className="section-shell p-8 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start lg:gap-10">
              <div className="space-y-5">
                <h2 className="section-title">About Everything Bagel</h2>
                <div className="max-w-2xl space-y-5 text-base leading-8 text-smoke sm:text-lg">
                  <p>
                    Hi everyone, I started this channel to document this season
                    of my life.
                  </p>
                  <p>
                    I&apos;m at a stage where I&apos;m still growing, changing, and
                    learning new things about myself. This time in my life has
                    brought new challenges, new experiences, and new ways of
                    seeing the world.
                  </p>
                  <p>
                    This is a space where I want to share my journey honestly.
                    Some days, I may share a walk, a simple routine, something
                    outside my comfort zone, or a quiet moment for myself. Other
                    days, I may talk about family, parenting, culture, mental
                    health, and everyday life.
                  </p>
                  <p>
                    I care deeply about staying healthy in every way:
                    physically, mentally, and emotionally. More than anything,
                    this space is about being real, staying open, and
                    continuing to grow through every season of life.
                  </p>
                  <p>
                    Sometimes I&apos;ll share in English, and sometimes I may speak
                    in Tibetan. When I do, I&apos;ll do my best to add captions so
                    everyone can feel included.
                  </p>
                  <p>
                    Thank you for being here. I hope this space feels warm,
                    honest, and encouraging.
                  </p>
                </div>
              </div>
              <div className="mx-auto w-full max-w-md rounded-[1.75rem] border border-[#e8d8c6] bg-[#fbf5ee] p-4 shadow-card">
                <div className="overflow-hidden rounded-3xl border border-[#ead9c8] bg-[#f5eadd]">
                  <Image
                    src="/images/mom-library.jpg"
                    alt="Portrait of the Everything Bagel creator sitting in a cozy library lounge"
                    width={1152}
                    height={1536}
                    className="h-[24rem] w-full object-cover object-center sm:h-[30rem]"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8 sm:pb-12">
        <div className="container">
          <div className="mb-8">
            <SectionHeading
              eyebrow="Channel Pillars"
              title="What lives inside this space"
              copy="Pieces of everyday life, gathered into one warm place."
            />
          </div>
          <ChannelPillarsCarousel pillars={channelPillars} />
        </div>
      </section>

      <section id="featured-video" className="pb-8 sm:pb-12">
        <div className="container">
          <ComingSoonCard />
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="container">
          <div className="section-shell p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6">
                <SectionHeading
                  eyebrow="Contact"
                  title="Send a message"
                  copy="For questions, collaborations, or kind notes, feel free to send a message."
                />
                <div className="rounded-[1.75rem] border border-[#ead9c8] bg-[#fbf5ee] p-6 shadow-soft">
                  <div className="mb-4 text-caramel">
                    <PaperPlaneIcon className="h-14 w-14" />
                  </div>
                  <p className="max-w-sm text-sm leading-7 text-smoke sm:text-base">
                    Your message will open in your email app, already addressed
                    and formatted for Everything Bagel.
                  </p>
                </div>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
