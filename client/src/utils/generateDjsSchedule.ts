import { IDetails, IShowsData } from "@/context/Context";
import s1 from "@/assets/s1.jpg";
import s2 from "@/assets/s2.jpg";
import s3 from "@/assets/s3.jpg";
import s4 from "@/assets/s4.jpg";
import s5 from "@/assets/s5.jpg";
import s6 from "@/assets/s6.jpg";
import s7 from "@/assets/s33.jpg";

const images = [s1, s2, s3, s4, s5, s6, s7];

// Function to format time like "09:00-10:00 AM"
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


export function getCurrentOrNextDJ(djs:any) {
  const now = new Date(); // current time in local
  const nowUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes())
  );

  // Helper: convert "HH:mm" to Date (UTC)
  const getUTCDate = (timeStr:any) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setUTCHours(hours, minutes, 0, 0);
    return d;
  };

  let currentDJ = null;
  let upcomingDJ = null;
  let minDiff = Infinity;

  for (const dj of djs) {
    if (!dj.djStartTime || !dj.djEndTime) continue;

    const start = getUTCDate(dj.djStartTime);
    const end = getUTCDate(dj.djEndTime);

    // Handle end before start (spanning midnight)
    if (end < start) end.setUTCDate(end.getUTCDate() + 1);

    if (nowUTC >= start && nowUTC <= end) {
      currentDJ = dj;
      break;
    } else if (start > nowUTC) {
      const diff = (start as any) - (nowUTC as any);
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






