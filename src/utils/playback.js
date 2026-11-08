// a video left this close to either end starts from the beginning
const RESUME_MARGIN = 15;

// Where playback picks up, in seconds: the saved position, unless it's at the very start or the very end.
export const resumeAt = (position, duration) => (position > RESUME_MARGIN && position < duration - RESUME_MARGIN ? position : 0);
