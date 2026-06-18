export function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
        // show hh:mm:ss
        return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    else if (mins > 0) {
        // show mm:ss
        return `${mins}:${String(secs).padStart(2, "0")}`;
    }
    else {
        // show ss only
        return `${secs}s`;
    }
}
export function convertToTotalHours(timeStr) {
    const parts = timeStr.toString().split(":").map(Number);
    let hours = 0;
    if (parts.length === 3) {
        hours = parts[0] + parts[1] / 60 + parts[2] / 3600;
    }
    else if (parts.length === 2) {
        hours = parts[0] / 60 + parts[1] / 3600;
    }
    else if (parts.length === 1) {
        hours = parts[0] / 3600;
    }
    return parseFloat(hours.toFixed(2)); // rounded to 2 decimals
}
