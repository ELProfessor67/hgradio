"use client";

import React from "react";
import { FaLock, FaShieldAlt } from "react-icons/fa";

/*
  The trust block for the non-card giving rails — Cash App, Zelle, Venmo,
  check / money order.

  The client's standing rule is that anywhere the site takes money, the giver
  sees a padlock and a statement that the transaction is secure. That rule was
  only being honoured on the card forms; "Other Ways To Give" handed out a
  Cashtag, two phone numbers and a mailing address with nothing said about
  safety at all.

  It deliberately does NOT reuse PaymentSecurityBadge. That badge's claim is
  "your card is encrypted in transit and charged through Authorize.Net", and
  none of that is true of these rails — money sent on Cash App never touches
  our processor. Putting the card badge here would be a false statement about
  where the money goes. What a giver actually needs on this panel is the
  advice below: confirm the handle, and know we will never ask for a login.

  Kept as one component so donate and sponsor make the identical claim; the
  giving pages have drifted apart on wording before.
*/
export default function AltGivingSecurityNote({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`border border-white/15 bg-black/20 p-4 ${className}`}
      aria-label="Giving security information"
    >
      <div className="flex items-center gap-2">
        <FaLock className="text-green-400 shrink-0" aria-hidden="true" />
        <span className="font-semibold text-[0.98rem]">
          Giving Safely
        </span>
      </div>

      <ul className="mt-2 space-y-1.5 text-sm text-gray-300 leading-relaxed list-disc list-inside">
        <li>
          Your gift is sent inside Cash App, Zelle or Venmo — those apps carry
          their own encryption and fraud protection. We never see or store
          your login, PIN or bank details.
        </li>
        <li>
          Check the handle above matches <span className="font-semibold">exactly</span>{" "}
          before you send. Copy it with the button rather than typing it.
        </li>
        <li>
          Hallelujah Gospel Globally will never phone, text or email you asking
          to redirect a gift to a different handle, account or address. If
          someone does, it is not us.
        </li>
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 text-xs">
          <FaShieldAlt className="text-green-400" aria-hidden="true" />
          <span className="font-semibold">Encrypted HTTPS</span>
          <span className="text-gray-400">This page</span>
        </span>
      </div>
    </div>
  );
}
