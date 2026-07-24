// Gera arquivo .ics (iCalendar) compatível com Google/Apple/Outlook
interface IcsEvent {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  meetingLink?: string | null;
  startsAt: string;
  endsAt: string;
  attendees?: { name?: string; email: string }[];
  organizerEmail?: string;
}

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildIcs(event: IcsEvent): string {
  const description = [event.description, event.meetingLink ? `Link: ${event.meetingLink}` : null]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hyon Tecnologia//Reunioes//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}@hyon.com.br`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(event.startsAt)}`,
    `DTEND:${toIcsDate(event.endsAt)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
  ];

  if (description) lines.push(`DESCRIPTION:${escapeIcs(description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
  if (event.meetingLink) lines.push(`URL:${event.meetingLink}`);
  if (event.organizerEmail) lines.push(`ORGANIZER:mailto:${event.organizerEmail}`);

  (event.attendees || []).forEach((a) => {
    const name = a.name ? `;CN=${escapeIcs(a.name)}` : "";
    lines.push(`ATTENDEE${name};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${a.email}`);
  });

  // Reminders no ICS (podem ser interpretados pelo cliente do usuário)
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reunião em 15 minutos",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reunião em 1 hora",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.join("\r\n");
}

export function downloadIcs(event: IcsEvent): void {
  const ics = buildIcs(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "reuniao"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Gera URL de "Adicionar ao Google Calendar" (abre o Google Calendar do usuário logado) */
export function googleCalendarUrl(event: IcsEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toIcsDate(event.startsAt)}/${toIcsDate(event.endsAt)}`,
  });
  const details = [event.description, event.meetingLink ? `Link: ${event.meetingLink}` : null]
    .filter(Boolean)
    .join("\n");
  if (details) params.set("details", details);
  if (event.location) params.set("location", event.location);
  const emails = (event.attendees || []).map((a) => a.email).filter(Boolean).join(",");
  if (emails) params.set("add", emails);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
