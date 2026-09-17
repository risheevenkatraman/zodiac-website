const platforms = {
  'x.com': [
    'X / Twitter',
    'M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.9-9L.8 2h6.5l4.5 6.7L18.9 2ZM17.8 20h1.7L6.3 3.9H4.5L17.8 20Z',
  ],
  'twitch.tv': [
    'Twitch',
    'M4 2 1 7v15h5v3l4-3h4l8-8V2H4Zm16 11-4 4h-4l-3 3v-3H5V4h15v9ZM15 7h2v6h-2V7Zm-5 0h2v6h-2V7Z',
  ],
  'youtube.com': [
    'YouTube',
    'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z',
  ],
  'tiktok.com': [
    'TikTok',
    'M16.7 1h-4v14.7a3.3 3.3 0 1 1-2.8-3.3V8.3a7.4 7.4 0 1 0 6.8 7.4V8.2a10 10 0 0 0 6 2V6.1a6.1 6.1 0 0 1-6-5.1Z',
  ],
};

export default function ProfileSocialLink({ url, label }) {
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    /* Keep unknown links accessible. */
  }
  if (host === 'twitter.com') host = 'x.com';
  if (host === 'youtu.be') host = 'youtube.com';
  const instagram = host === 'instagram.com';
  const platform = platforms[host];
  const name = instagram ? 'Instagram' : platform?.[0] || label || 'Website';
  return (
    <a
      className="profile-social-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${name} (opens in a new tab)`}
      title={name}
    >
      <svg
        viewBox={host === 'twitch.tv' ? '0 0 24 26' : '0 0 24 24'}
        aria-hidden="true"
        focusable="false"
      >
        {instagram ? (
          <g fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </g>
        ) : platform ? (
          <path d={platform[1]} fillRule="evenodd" />
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="9" />
            <ellipse cx="12" cy="12" rx="4" ry="9" />
            <path d="M3 12h18" />
          </g>
        )}
      </svg>
    </a>
  );
}
