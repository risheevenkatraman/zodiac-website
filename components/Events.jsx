'use client';
import { useEffect, useState } from 'react';

export default function Events({ initialEvents }) {
  const [upcoming, setUpcoming] = useState(null);
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    setUpcoming(
      initialEvents
        .filter((event) => {
          const date = new Date(event.date + 'T12:00:00');
          return date >= today && date < end;
        })
        .sort((a, b) => a.date.localeCompare(b.date)),
    );
  }, [initialEvents]);
  return (
    <div id="event-timeline" className="event-timeline" aria-live="polite">
      {upcoming === null ? (
        <p className="event-status celestial-status">Aligning the calendar…</p>
      ) : upcoming.length === 0 ? (
        <p className="event-status">
          No upcoming events this month. Check back soon for our next matches and community nights.
        </p>
      ) : (
        <div className="celestial-schedule">
          <div className="schedule-heading">
            <p>
              {new Date(upcoming[0].date + 'T12:00:00').toLocaleDateString('en', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <span>
              {upcoming.length} {upcoming.length === 1 ? 'event' : 'events'} ahead
            </span>
          </div>
          <ol className="schedule-track" aria-label="Upcoming events in date order">
            {upcoming.map((event, index) => {
              const date = new Date(event.date + 'T12:00:00');
              return (
                <li className="schedule-event" key={`${event.date}-${event.name}`}>
                  <time
                    className="schedule-date"
                    dateTime={event.date}
                    aria-label={date.toLocaleDateString('en', { dateStyle: 'full' })}
                  >
                    <span aria-hidden="true">{date.toLocaleString('en', { month: 'short' })}</span>
                    <strong aria-hidden="true">{String(date.getDate()).padStart(2, '0')}</strong>
                    <small aria-hidden="true">
                      {date.toLocaleString('en', { weekday: 'short' })}
                    </small>
                  </time>
                  <span className="schedule-star" aria-hidden="true">
                    <svg viewBox="0 0 32 32">
                      <path d="M16 1 20 12 31 16 20 20 16 31 12 20 1 16 12 12Z" />
                    </svg>
                  </span>
                  <article className="schedule-story">
                    {index === 0 && <p className="eyebrow">Next in our orbit</p>}
                    <h3>{event.name}</h3>
                    <p>{event.description}</p>
                  </article>
                </li>
              );
            })}
          </ol>
          <p className="schedule-signoff">
            <span aria-hidden="true">✧</span> More moments are written in the stars. Stay close.
          </p>
        </div>
      )}
      <noscript>
        <p>
          See the{' '}
          <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/data/events.json`}>
            events schedule
          </a>{' '}
          for upcoming matches.
        </p>
      </noscript>
    </div>
  );
}
