"use client";

import React from "react";
import { FaLock, FaShieldAlt, FaCreditCard } from "react-icons/fa";

/*
  The trust block that has to sit on every page that takes money.

  The client's standing rule: wherever a card number can be typed, the visitor
  must be able to see who processes the payment and that the connection is
  encrypted — the padlock, the processor's name, the PCI wording. A donor who
  can't see that has no reason to believe the form is safe, and giving pages
  live or die on that.

  Kept as one component on purpose. The giving pages drifted apart before,
  each carrying its own paragraph of security copy in slightly different
  words; this way the claim is written once and every page makes the same one.
*/

/*
  Processors shown on the badge.

  Authorize.Net is here because the backend genuinely charges through it
  (AUTHORIZENET_API_LOGIN_ID / AUTHORIZENET_TRANSACTION_KEY in the API's env,
  authorizenet SDK in every payment controller).

  Paysafe is deliberately OFF. There is no Paysafe merchant account wired into
  this codebase — no keys, no SDK, no code path. Showing a Paysafe seal over a
  form that charges through Authorize.Net would tell donors something untrue
  about where their card goes, which is the opposite of what a trust badge is
  for. Flip `enabled` to true the moment a real Paysafe account is connected
  and this appears on all four giving surfaces at once.
*/
const PROCESSORS = [
  {
    key: "authorizenet",
    name: "Authorize.Net",
    note: "Card processing",
    enabled: true,
  },
  {
    key: "paysafe",
    name: "Paysafe",
    note: "Card processing",
    enabled: false,
  },
] as const;

/**
 * Authorize.Net's Verified Merchant Seal, if the merchant's own seal id is set
 * in the environment. The seal is issued per merchant and has to be the real
 * one — an invented id renders a broken seal, which reads worse than none.
 */
function VerifiedMerchantSeal() {
  const sealId = process.env.NEXT_PUBLIC_AUTHORIZENET_SEAL_ID;
  if (!sealId) return null;

  return (
    <a
      href={`https://verify.authorize.net/anetseal/?pid=${sealId}&rurl=${encodeURIComponent(
        typeof window !== "undefined" ? window.location.href : ""
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-second underline underline-offset-2"
    >
      Verify this merchant with Authorize.Net
    </a>
  );
}

export default function PaymentSecurityBadge({
  className = "",
  /** `compact` drops the sub-copy — for tight spots like a summary sidebar. */
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const active = PROCESSORS.filter((p) => p.enabled);

  return (
    <div
      className={`border border-white/15 bg-[#d9d9d9]/5 p-4 ${className}`}
      aria-label="Payment security information"
    >
      <div className="flex items-center gap-2">
        <FaLock className="text-green-400 shrink-0" aria-hidden="true" />
        <span className="font-semibold text-[0.98rem]">Secure Payment</span>
      </div>

      {!compact && (
        <p className="text-sm text-gray-300 mt-2 leading-relaxed">
          This page is served over an encrypted HTTPS connection. Your card
          number, expiry and CVV are transmitted with TLS/SSL encryption
          straight to the payment processor — they are never stored on this
          site or on our servers.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {active.map((p) => (
          <span
            key={p.key}
            className="inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 text-xs"
          >
            <FaCreditCard className="text-second" aria-hidden="true" />
            <span className="font-semibold">{p.name}</span>
            <span className="text-gray-400">{p.note}</span>
          </span>
        ))}

        <span className="inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 text-xs">
          <FaShieldAlt className="text-green-400" aria-hidden="true" />
          <span className="font-semibold">PCI-DSS</span>
          <span className="text-gray-400">Compliant processing</span>
        </span>
      </div>

      <div className="mt-2">
        <VerifiedMerchantSeal />
      </div>
    </div>
  );
}
