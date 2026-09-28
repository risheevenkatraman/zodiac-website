'use client';
import type { ComponentProps } from 'react';

import Link, { useLinkStatus } from 'next/link';

function PendingStar() {
  const { pending } = useLinkStatus();
  return pending ? (
    <span className="link-pending" role="status" aria-label="Loading page">
      <span aria-hidden="true">✦</span>
    </span>
  ) : null;
}

export default function SiteLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <PendingStar />
    </Link>
  );
}
