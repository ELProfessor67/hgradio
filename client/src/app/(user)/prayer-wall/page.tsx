/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Breadcrum from "@/components/Breadcrum";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FaPrayingHands, FaRegHeart } from "react-icons/fa";

/*
  THE PRAYER WALL

  The other half of the app's prayer request form. When someone sends a request
  they choose whether it stays with the prayer team or may be shared; the ones
  they agreed to share, and an admin approved, are read here and in the app's
  Encourage > Prayer tab. Same endpoint, same list, both places.

  Nothing on this page decides what is safe to show. The server filters on the
  sender's own choice before it filters on approval, and it never sends the
  email or phone number they gave us — so there is no field here that could
  leak contact details even by accident.
*/

interface PrayerRequestItem {
  _id: string;
  name: string;
  message: string;
  prayerCount: number;
  createdAt?: string;
}

const PAGE_SIZE = 12;

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

const formatDate = (value?: string) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const PrayerCard = ({
  item,
  onPrayed,
}: {
  item: PrayerRequestItem;
  onPrayed: (id: string, count: number) => void;
}) => {
  const [prayed, setPrayed] = useState(false);
  const [busy, setBusy] = useState(false);

  /*
    Optimistic, with a rollback. The number is the whole point of the button —
    it tells the person who asked that they are not praying alone — so it must
    never show a prayer the server did not record.
  */
  const pray = async () => {
    if (prayed || busy) return;
    setBusy(true);
    setPrayed(true);
    const before = item.prayerCount;
    onPrayed(item._id, before + 1);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/prayer-requests/${item._id}/pray`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not record that");
      onPrayed(item._id, data.prayerCount);
    } catch (err: any) {
      setPrayed(false);
      onPrayed(item._id, before);
      toast.error(err?.message || "Could not record that", {
        style: { background: "red", color: "white" },
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-l-4 border-[#5A6ACF] bg-[#0b1834] p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#5A6ACF] text-lg font-bold text-white">
          {initials(item.name) || "?"}
        </div>
        <div className="text-white">
          <div className="text-[1.1rem] font-semibold leading-snug">{item.name}</div>
          <div className="text-sm leading-snug text-[#c8c8c8]">{formatDate(item.createdAt)}</div>
        </div>
      </div>

      <p className="mt-5 flex-1 whitespace-pre-line text-[1.02rem] leading-relaxed text-white/90">
        {item.message}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={pray}
          disabled={prayed || busy}
          aria-label={
            prayed
              ? `You prayed for ${item.name}`
              : `I prayed for this request from ${item.name}`
          }
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
            prayed
              ? "cursor-default bg-[#5A6ACF]/20 text-[#9fb0ff]"
              : "bg-[#5A6ACF] text-white hover:bg-[#6d7be0] disabled:opacity-60"
          }`}
        >
          {prayed ? <FaRegHeart /> : <FaPrayingHands />}
          {prayed ? "You prayed" : "I prayed for this"}
        </button>

        <span className="text-sm text-[#c8c8c8]">
          {item.prayerCount === 1 ? "1 person prayed" : `${item.prayerCount} people prayed`}
        </span>
      </div>
    </div>
  );
};

/*
  The form that feeds the wall.

  Private is preselected and stays preselected after every send, so the safe
  outcome is the one that needs no thought — and a sharing choice made by one
  visitor never carries over to the next person on a shared computer. The
  confirmation is whatever the server sends back, because the server words it
  from what it actually stored: telling someone their request stays private
  while the record says otherwise is the one failure this feature must not have.
*/
const AskForPrayer = ({ onSent }: { onSent: () => void }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return toast.error("Please enter your name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Please enter a valid email");
    if (!message.trim()) return toast.error("Please write your prayer request");

    setSending(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/prayer-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phone: phone.trim(),
            message: message.trim(),
            visibility,
            source: "web",
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Something went wrong");

      toast.success(data.message || "Your prayer request has been sent", {
        style: { background: "green", color: "white" },
        duration: 6000,
      });

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setVisibility("private");
      onSent();
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong", {
        style: { background: "red", color: "white" },
      });
    } finally {
      setSending(false);
    }
  };

  const field =
    "w-full bg-[#0b1834] px-4 py-3 text-white outline-none placeholder:text-white/40 border border-white/10 focus:border-[#5A6ACF]";

  const CHOICES: { key: "private" | "public"; title: string; hint: string }[] = [
    {
      key: "private",
      title: "Just the prayer team",
      hint: "Not shared or published anywhere",
    },
    {
      key: "public",
      title: "Share it on the Prayer Wall",
      hint: "After our team reviews it, others can read it and pray with you",
    },
  ];

  return (
    <div className="border border-white/10 bg-[#0b1834]/60 p-6 md:p-8">
      <h3 className="text-[1.3rem] font-semibold">Ask for prayer</h3>
      <p className="mt-2 text-white/70">
        Tell us what you are facing. You choose below who is allowed to see it.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className={field}
            placeholder="First name *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className={field}
            placeholder="Last name *"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            className={field}
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={field}
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <textarea
          className={field}
          rows={5}
          placeholder="Share what we can pray for… *"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <fieldset>
          <legend className="mb-2 font-semibold">Who can see this?</legend>
          <div className="grid gap-3 md:grid-cols-2">
            {CHOICES.map((c) => {
              const active = visibility === c.key;
              return (
                <label
                  key={c.key}
                  className={`flex cursor-pointer items-start gap-3 border p-4 transition ${
                    active
                      ? "border-[#5A6ACF] bg-[#5A6ACF]/15"
                      : "border-white/10 bg-[#0b1834] hover:border-white/25"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    className="mt-1 accent-[#5A6ACF]"
                    checked={active}
                    onChange={() => setVisibility(c.key)}
                  />
                  <span>
                    <span className="block font-semibold">{c.title}</span>
                    <span className="block text-sm text-white/60">{c.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={sending}
          className="bg-[#5A6ACF] px-8 py-3 font-bold text-white transition hover:bg-[#6d7be0] disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send Prayer Request"}
        </button>
      </form>
    </div>
  );
};

const Page = () => {
  const [items, setItems] = useState<PrayerRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  // The wall is what people came to read, so the form stays folded away behind
  // a button until someone actually wants it.
  const [askOpen, setAskOpen] = useState(false);

  const load = useCallback(async (nextPage: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/prayer-requests?page=${nextPage}&limit=${PAGE_SIZE}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not load the Prayer Wall");

      setItems((prev) =>
        nextPage === 1 ? data.requests || [] : [...prev, ...(data.requests || [])]
      );
      setHasMore(!!data.hasMore);
      setPage(nextPage);
      setError("");
    } catch (err: any) {
      setError(err?.message || "Could not load the Prayer Wall");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const onPrayed = (id: string, count: number) =>
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, prayerCount: count } : it)));

  return (
    <div>
      <Breadcrum mainTitle="Prayer Wall" subTitle="Prayer Wall" />

      <div className="bg-[#071126]">
        <div className="mx-auto max-w-[1500px] px-8 py-12 text-white">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <h2 className="text-[1.6rem] font-semibold">Pray with our family</h2>
              <p className="mt-4 text-lg text-white/80">
                These are prayer requests our listeners asked us to share. Read them, stand with
                them, and tap <span className="font-semibold">I prayed for this</span> so they know
                they are not praying alone.
              </p>
              <p className="mt-3 text-white/60">
                Requests marked for our prayer team only are never shown here — they stay between
                the sender and the team.
              </p>
            </div>

            <div className="mb-14">
              <button
                type="button"
                onClick={() => setAskOpen((v) => !v)}
                aria-expanded={askOpen}
                aria-controls="ask-for-prayer"
                className="flex items-center gap-3 bg-[#5A6ACF] px-8 py-3.5 font-bold text-white transition hover:bg-[#6d7be0]"
              >
                <FaPrayingHands />
                {askOpen ? "Close" : "Ask for Prayer"}
              </button>

              {askOpen && (
                <div id="ask-for-prayer" className="mt-6">
                  <AskForPrayer
                    onSent={() => {
                      load(1);
                      // Fold it back up on success: the confirmation toast has
                      // already said what happened, and leaving a cleared form
                      // open reads as though the send did not go through.
                      setAskOpen(false);
                    }}
                  />
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent border-[#5A6ACF]" />
              </div>
            ) : error ? (
              <div className="py-16 text-center text-white/70">{error}</div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-white/70">
                No shared requests yet. When someone asks us to share theirs, it will appear here
                for the whole family to pray over.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {items.map((item) => (
                  <PrayerCard key={item._id} item={item} onPrayed={onPrayed} />
                ))}
              </div>
            )}

            {hasMore && !loading && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => {
                    setLoadingMore(true);
                    load(page + 1);
                  }}
                  className="rounded-full border border-[#5A6ACF] px-8 py-3 font-bold text-[#9fb0ff] transition hover:bg-[#5A6ACF] hover:text-white disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : "More prayer requests"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
