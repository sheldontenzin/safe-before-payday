type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  copy: string;
};

export function SectionHeading({
  eyebrow,
  title,
  copy
}: SectionHeadingProps) {
  return (
    <div className="space-y-4">
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 className="section-title">{title}</h2>
      <p className="section-copy">{copy}</p>
    </div>
  );
}
