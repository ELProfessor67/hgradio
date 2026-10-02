/**
 * DAILY DEVOTIONS — the KJV set supplied by the client (Sep 2026), replacing
 * the previous NIV table wholesale.
 *
 * ⚠️ NO "DAY 1 / DAY 2" LABELS. The source document numbers its readings, but
 * the client was explicit that the numbering must not be shown: the page
 * already prints the date above the reading, so a "Day 4" heading underneath
 * would be a second, competing way of saying which day it is. Each entry opens
 * with its THEME ("Created With Purpose"), not its ordinal. The numbering
 * survives only as this table's key, which is what rotates the reading by date.
 *
 * ⚠️ THE SOURCE HAS 22 READINGS, NOT 31. The document is titled "31 Daily
 * Devotions" but contains 22 pages, Day 1 through Day 22. Days 23-31 wrap back
 * to the start of the set (see getDevotionForDay). Nothing here is invented:
 * writing nine devotions to fill the gap would mean authoring scripture
 * commentary the station never approved. Drop the missing nine in below and
 * the wrap stops on its own.
 *
 * This was lifted out of the `Daily` component in app/(user)/about/page.tsx,
 * where it sat inline as ~950 lines. The app (hgradioApp) keeps an identical
 * copy at src/constants/devotions.ts — keep the two in step.
 */

export type DevotionBlockType =
  | "title"
  | "subtitle"
  | "section"
  | "verse"
  | "paragraph"
  | "prayer";

export interface DevotionBlock {
  type: DevotionBlockType;
  text: string;
}

/** How many readings the client has actually supplied. */
export const DEVOTION_COUNT = 22;

const DEVOTIONS: Record<number, DevotionBlock[]> = {
  1: [
    { type: "title", text: "Created With Purpose" },
    { type: "subtitle", text: "Ephesians 2:10 (KJV)" },
    { type: "verse", text: "For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "You are not here by accident. God created you with purpose and has prepared good works for you to accomplish. Even when you cannot see the whole plan, you can trust the One who created you." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, thank You for creating me with purpose. Help me to recognize the opportunities You place before me and faithfully walk in the works You have prepared for me. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "I am God's workmanship, created for His purpose." },
  ],
  2: [
    { type: "title", text: "Trust in the Lord" },
    { type: "subtitle", text: "Proverbs 3:5-6 (KJV)" },
    { type: "verse", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "We often want to understand everything before we move forward. God asks us to trust Him even when the road ahead is unclear. When we acknowledge Him, He promises to direct our path." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, help me trust You completely. When I do not understand what is happening, keep my heart focused on You. Direct my steps according to Your will. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "I will trust God even when I cannot see the way." },
  ],
  3: [
    { type: "title", text: "God's Strength" },
    { type: "subtitle", text: "Philippians 4:13 (KJV)" },
    { type: "verse", text: "I can do all things through Christ which strengtheneth me." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Our strength does not come only from ourselves. Christ gives us strength to face responsibilities, difficulties, disappointments, and challenges." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord Jesus, strengthen me today. When I feel weak, remind me that my strength comes from You. Help me face every challenge with faith. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "Christ is my strength." },
  ],
  4: [
    { type: "title", text: "Do Not Fear" },
    { type: "subtitle", text: "Isaiah 41:10 (KJV)" },
    { type: "verse", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God..." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Fear can make tomorrow appear frightening, but God reminds us that He is with us. His presence is greater than the circumstances surrounding us." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Father, remove fear from my heart. Help me remember that You are with me and that I do not have to face today alone. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "God is with me; therefore I will not fear." },
  ],
  5: [
    { type: "title", text: "God's Peace" },
    { type: "subtitle", text: "John 14:27 (KJV)" },
    { type: "verse", text: "Peace I leave with you, my peace I give unto you..." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "The peace Christ gives is different from the peace the world offers. Circumstances may change, but His peace can remain in our hearts." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord Jesus, fill my heart with Your peace. Quiet my worries and help me trust You with everything that concerns me. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "The peace of Christ is greater than my circumstances." },
  ],
  6: [
    { type: "title", text: "Wait Upon the Lord" },
    { type: "subtitle", text: "Isaiah 40:31 (KJV)" },
    { type: "verse", text: "But they that wait upon the LORD shall renew their strength..." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Waiting can be difficult, especially when we want answers immediately. Yet God can use seasons of waiting to strengthen our faith and prepare us for what lies ahead." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, teach me to wait patiently for You. Renew my strength and help me trust Your timing. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "God's timing is worth waiting for." },
  ],
  7: [
    { type: "title", text: "God's Word" },
    { type: "subtitle", text: "Psalm 119:105 (KJV)" },
    { type: "verse", text: "Thy word is a lamp unto my feet, and a light unto my path." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "God's Word gives direction when life seems confusing. We may not see the entire journey, but Scripture can provide enough light for the next step." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, let Your Word guide my decisions, thoughts, and actions. Help me not only to read Your Word but also to live according to it. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "God's Word lights my path." },
  ],
  8: [
    { type: "title", text: "Be Strong and Courageous" },
    { type: "subtitle", text: "Joshua 1:9 (KJV)" },
    { type: "verse", text: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Courage does not mean that we never feel afraid. True courage means moving forward while trusting that God is with us." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, give me courage to face whatever is before me. Help me remember that Your presence goes with me wherever I go. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "I can move forward because God is with me." },
  ],
  9: [
    { type: "title", text: "God's Faithfulness" },
    { type: "subtitle", text: "Lamentations 3:22-23 (KJV)" },
    { type: "verse", text: "It is of the LORD'S mercies that we are not consumed, because his compassions fail not. They are new every morning..." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Every morning is another reminder of God's mercy. Yesterday may have contained mistakes, disappointments, or failures, but God's mercy is not exhausted." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Father, thank You for Your mercy and faithfulness. Give me a fresh heart today and help me walk faithfully with You. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "God's mercies are new every morning." },
  ],
  10: [
    { type: "title", text: "Cast Your Cares on God" },
    { type: "subtitle", text: "1 Peter 5:7 (KJV)" },
    { type: "verse", text: "Casting all your care upon him; for he careth for you." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "God does not ask us to carry every burden alone. We can bring our worries, fears, and concerns to Him because He cares about us." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, I give You every burden that I am carrying today. Help me trust You instead of allowing worry to control my heart. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "God cares about what concerns me." },
  ],
  11: [
    { type: "title", text: "Seek God First" },
    { type: "subtitle", text: "Matthew 6:33 (KJV)" },
    { type: "verse", text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Life can become filled with possessions, responsibilities, plans, and worries. Jesus reminds us to put God's kingdom first." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, help me put You first in every area of my life. Let my priorities reflect Your will. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "God comes first in my life." },
  ],
  12: [
    { type: "title", text: "God's Protection" },
    { type: "subtitle", text: "Psalm 121:7-8 (KJV)" },
    { type: "verse", text: "The LORD shall preserve thee from all evil: he shall preserve thy soul. The LORD shall preserve thy going out and thy coming in..." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Our lives are not outside God's sight. Wherever we go, we can trust Him to watch over us and keep our hearts secure in Him." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Father, watch over me and my family. Protect us as we go out and return home. Keep us close to You. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "The Lord watches over my coming and going." },
  ],
  13: [
    { type: "title", text: "Forgiveness" },
    { type: "subtitle", text: "1 John 1:9 (KJV)" },
    { type: "verse", text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "God does not ask us to hide our failures. He calls us to confess them. His forgiveness reminds us that our past does not have to control our future." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, forgive me for my sins and cleanse my heart. Help me turn away from what is wrong and walk closely with You. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "God's forgiveness brings a new beginning." },
  ],
  14: [
    { type: "title", text: "Love One Another" },
    { type: "subtitle", text: "John 13:34 (KJV)" },
    { type: "verse", text: "A new commandment I give unto you, That ye love one another; as I have loved you..." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Christian love is more than words. It is shown through kindness, patience, forgiveness, compassion, and service." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, teach me to love others as You have loved me. Give me patience and compassion toward everyone I meet. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "I will show Christ's love through my actions." },
  ],
  15: [
    { type: "title", text: "God Hears Prayer" },
    { type: "subtitle", text: "Jeremiah 33:3 (KJV)" },
    { type: "verse", text: "Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Prayer is an invitation from God to come to Him. We may not always receive the answer we expect, but we can always bring our needs before Him." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Father, teach me to pray with faith. Help me listen for Your direction and trust You with the answers. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "I can always call upon God." },
  ],
  16: [
    { type: "title", text: "Be Still" },
    { type: "subtitle", text: "Psalm 46:10 (KJV)" },
    { type: "verse", text: "Be still, and know that I am God..." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Sometimes our minds are filled with noise and worry. God invites us to become still and remember who He is." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, quiet my heart today. Help me stop worrying about things I cannot control and remember that You are God. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "I will be still and trust God." },
  ],
  17: [
    { type: "title", text: "God's Grace" },
    { type: "subtitle", text: "2 Corinthians 12:9 (KJV)" },
    { type: "verse", text: "My grace is sufficient for thee: for my strength is made perfect in weakness." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "We may recognize weaknesses in ourselves, but God's grace is not limited by our weakness. His strength can sustain us when our own strength is insufficient." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, thank You for Your sufficient grace. Help me depend upon You rather than relying only upon myself. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "God's grace is sufficient for me." },
  ],
  18: [
    { type: "title", text: "Walk by Faith" },
    { type: "subtitle", text: "2 Corinthians 5:7 (KJV)" },
    { type: "verse", text: "For we walk by faith, not by sight." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Faith means trusting God even when we cannot see how everything will work out. We follow Him because we trust His character and His promises." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, increase my faith. Help me trust You when circumstances are uncertain and continue walking with You. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "I walk by faith, not by sight." },
  ],
  19: [
    { type: "title", text: "Give Thanks" },
    { type: "subtitle", text: "1 Thessalonians 5:18 (KJV)" },
    { type: "verse", text: "In every thing give thanks: for this is the will of God in Christ Jesus concerning you." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Gratitude changes our perspective. Even during difficult seasons, there are reasons to thank God for His presence, mercy, salvation, and faithfulness." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, give me a thankful heart. Help me recognize Your blessings even during difficult circumstances. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "I will choose gratitude today." },
  ],
  20: [
    { type: "title", text: "God's Plans" },
    { type: "subtitle", text: "Jeremiah 29:11 (KJV)" },
    { type: "verse", text: "For I know the thoughts that I think toward you, saith the LORD..." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "God sees what we cannot see. When the future feels uncertain, we can continue trusting Him and seeking His direction." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Father, I place my future in Your hands. Guide my decisions and help me trust Your purposes for my life. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "My future is in God's hands." },
  ],
  21: [
    { type: "title", text: "The Good Shepherd" },
    { type: "subtitle", text: "Psalm 23:1 (KJV)" },
    { type: "verse", text: "The LORD is my shepherd; I shall not want." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "A shepherd watches over his sheep, provides for them, and guides them. God invites us to trust Him as our Shepherd." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, be my Shepherd today. Lead me, provide for me, and keep me close to You. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "The Lord is my Shepherd." },
  ],
  22: [
    { type: "title", text: "Do Not Give Up" },
    { type: "subtitle", text: "Galatians 6:9 (KJV)" },
    { type: "verse", text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not." },
    { type: "section", text: "Reflection" },
    { type: "paragraph", text: "Doing what is right can sometimes feel exhausting, especially when results are not immediately visible. God's Word encourages us to remain faithful." },
    { type: "section", text: "Prayer" },
    { type: "prayer", text: "Lord, give me strength when I become tired. Help me continue doing good and remain faithful even when I do not see immediate results. Amen." },
    { type: "section", text: "Meditation" },
    { type: "paragraph", text: "I will remain faithful and not give up." },
  ],
};

/**
 * The reading for a given day of the month. With 22 readings, the last stretch
 * of a long month wraps back to the start of the set — a stopgap for the nine
 * readings missing from the supplied document, not a design. Adding entries
 * 23-31 above retires it automatically.
 */
export function getDevotionForDay(day: number): DevotionBlock[] {
  const n = Math.floor(day);
  if (!Number.isFinite(n) || n < 1) return DEVOTIONS[1];
  return DEVOTIONS[n] ?? DEVOTIONS[((n - 1) % DEVOTION_COUNT) + 1] ?? DEVOTIONS[1];
}
