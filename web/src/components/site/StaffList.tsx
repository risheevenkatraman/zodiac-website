"use client";

import Image from "next/image";
import type { Staff } from "@/lib/data";
import { asset } from "@/lib/data";
import { SocialIcon } from "./SocialIcon";
import { StarGlyph } from "./StarGlyph";

/** The staff as atlas entries: a row per person that opens to their own words. Native disclosure, one open at a time. */
export function StaffList({ staff }: { staff: Staff[] }) {
  return (
    <ul className="mt-6 grid gap-px">
      {staff.map((s) => {
        const bio = s.introduction?.trim();
        return (
          <li key={s.id} className="hairline-plate border-t">
            <details name="staff" className="group">
              <summary className="flex cursor-pointer list-none items-center gap-4 py-4 [&::-webkit-details-marker]:hidden">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-ink/15">
                  <Image src={asset(s.image)} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3">
                  <span className="font-medium text-plate-ink">{s.name}</span>
                  <span className="caps text-plate-muted">{s.role}</span>
                </span>
                {s.socials?.[0] && (
                  <a
                    href={s.socials[0].url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink"
                    aria-label={`${s.name} on ${s.socials[0].label}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SocialIcon label={s.socials[0].label} size={14} />
                  </a>
                )}
                {bio && (
                  <span className="caps flex shrink-0 items-center gap-2 text-plate-muted transition-colors group-hover:text-ink">
                    <span className="group-open:hidden">Read bio</span>
                    <span className="hidden group-open:inline">Close</span>
                    <StarGlyph size={10} className="text-ink transition-transform duration-300 ease-out group-open:rotate-45" />
                  </span>
                )}
              </summary>
              {bio && (
                <p className="font-text max-w-[60ch] pb-6 pl-14 text-[1.05rem] leading-relaxed text-plate-ink/85">{bio}</p>
              )}
            </details>
          </li>
        );
      })}
    </ul>
  );
}
