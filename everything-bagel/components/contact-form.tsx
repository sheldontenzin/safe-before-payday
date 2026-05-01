"use client";

export function ContactForm() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    const subject = "Message from Everything Bagel website";
    const body = [
      `Name: ${name || "-"}`,
      `Email: ${email || "-"}`,
      "",
      "Message:",
      message || "-"
    ].join("\n");

    const mailtoUrl = `mailto:sdolma291@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-semibold text-ink">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Your name"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-caramel focus:ring-2 focus:ring-caramel/20"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-caramel focus:ring-2 focus:ring-caramel/20"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-semibold text-ink">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Write your message here"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-caramel focus:ring-2 focus:ring-caramel/20"
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-base font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        Send message
      </button>
    </form>
  );
}
