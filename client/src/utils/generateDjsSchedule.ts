import { IDetails, IShowsData } from "@/context/Context";
import s1 from "@/assets/s1.jpg";
import s2 from "@/assets/s2.jpg";
import s3 from "@/assets/s3.jpg";
import s4 from "@/assets/s4.jpg";
import s5 from "@/assets/s5.jpg";
import s6 from "@/assets/s6.jpg";
import s7 from "@/assets/s33.jpg";

const images = [s1, s2, s3, s4, s5, s6, s7];

/**
 * Formats "HH:MM|HH:MM" for the shows grid.
 *
 * ⚠️ These digits are UTC, and are printed unconverted — so this string is
 * wrong for every viewer who is not on UTC.
 * The schedule page and the popup both read `/schedule-public` instead, which
 * shows the viewer's own time. Anywhere this string is still displayed should
 * move to that feed too — it is the last unconverted time label left.
 */
function formatTime(rawTime:any) {
  const [start, end] = rawTime.split('|');
  
  const format = (time:any) => {
    let [h, m] = time.split(':').map(Number);
    let period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${period}`;
  };

  return `${format(start)} - ${format(end)}`;
}

// Function to get day names from djDays array or assign all days if empty
function getDays(djDays:any) {
  const allDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (!djDays || djDays.length === 0) {
    return allDays;
  }
  return djDays.map((d:any) => allDays[parseInt(d)]);
}

// Main conversion function
export function convertToShowsData(data:any) {
  const showsData:IShowsData = {
    Sunday: [],
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: []
  };

  const details: IDetails = {};

  data.teams.forEach((team:any, index: number) => {
    const days = getDays(team.djDays);
    const time = formatTime(team.rawTime);
    const show:any = {
      id: team._id,
      showImg: images[index % images.length],
      artistImg: images[index % images.length],
      time: time,
      showName: team.name,
      artistName: team.name
    };

    days.forEach((day:any) => {
      showsData[day].push(show);
    });


    details[team._id] = {
      showName: team.name,
      artistName: team.name,
      role: "Studio Engineer", // ya aap team.role se le sakte ho agar available ho
      description: `${team.name} is a compelling show featuring uplifting content. Join us for an hour of inspiration and positivity. Tune in to experience a blend of music, stories, and insights that will brighten your day. Don't miss out on this enriching experience!`,
      artistImg: images[index % images.length],
      schedule: days.map((day: any) => {
        const times = time.split(" - ");
        return {
          day: day,
          startTime: times[0],
          endTime: times[1]
        };
      })
    };
  });

  return {showsData, details};
}


/**
 * Which DJ is on air, or on next.
 *
 * ⚠️ `djStartTime` / `djEndTime` are UTC — confirmed by the panel developer.
 * The original code was right about that much; what it got wrong was pairing a
 * UTC calculation with labels elsewhere that printed the same digits as if
 * they were local. Everything user-facing now converts, so this and the
 * schedule finally agree.
 *
 * Kept on `Date.UTC` rather than the shared resolver because `/all-djs`
 * returns a different shape from `/schedule-public` (numeric `djDays`, no
 * per-entry zone). Anything user-facing should prefer the schedule feed, which
 * is what the schedule page and the popup read now.
 */
export function getCurrentOrNextDJ(djs: any) {
  const now = Date.now();

  /** "HH:MM" UTC, on today's UTC date, as a real instant. */
  const todayAtUTC = (timeStr: string): Date | null => {
    const [h, m] = timeStr.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const d = new Date();
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m)
    );
  };

  let currentDJ = null;
  let upcomingDJ = null;
  let minDiff = Infinity;

  for (const dj of djs ?? []) {
    if (!dj.djStartTime || !dj.djEndTime) continue;

    const start = todayAtUTC(dj.djStartTime);
    let end = todayAtUTC(dj.djEndTime);
    if (!start || !end) continue;

    // Ends "before" it starts → it runs past midnight.
    if (end.getTime() <= start.getTime()) {
      end = new Date(end.getTime() + 86_400_000);
    }

    if (now >= start.getTime() && now <= end.getTime()) {
      currentDJ = dj;
      break;
    } else if (start.getTime() > now) {
      const diff = start.getTime() - now;
      if (diff < minDiff) {
        minDiff = diff;
        upcomingDJ = dj;
      }
    }
  }

  if (currentDJ) return { status: "live", dj: currentDJ };
  if (upcomingDJ) return { status: "upcoming", dj: upcomingDJ };
  return { status: "none", dj: null };
}
