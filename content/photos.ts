/**
 * The photos page. Drop images into /public/photos and list them here.
 * width/height are the image's real pixel size (lets the grid lay out before
 * the images load). On a Mac: right-click, Get Info. On Windows: Properties, Details.
 * Keep images around 2000px on the long edge; next/image makes smaller copies for you.
 */

export interface Photo {
  src: string;
  width: number;
  height: number;
  /** Describe the picture for people who can't see it. */
  alt: string;
  caption?: string;
}

export const photos: Photo[] = [
  { src: '/photos/placeholder-1.jpg', width: 1600, height: 1067, alt: 'Placeholder: a misty forest trail', caption: 'Morning fog on the climb' },
  { src: '/photos/placeholder-2.jpg', width: 1067, height: 1600, alt: 'Placeholder: a misty forest trail', caption: 'Tall pines, soft dirt' },
  { src: '/photos/placeholder-3.jpg', width: 1280, height: 1600, alt: 'Placeholder: a misty forest trail', caption: 'Somewhere past the second switchback' },
  { src: '/photos/placeholder-4.jpg', width: 1600, height: 900, alt: 'Placeholder: a misty forest trail', caption: 'Blue hour on the fire road' },
  { src: '/photos/placeholder-5.jpg', width: 1400, height: 1400, alt: 'Placeholder: a misty forest trail', caption: 'Lunch spot' },
  { src: '/photos/placeholder-6.jpg', width: 1600, height: 1067, alt: 'Placeholder: a misty forest trail', caption: 'Rooty section, slower than it looks' },
  { src: '/photos/placeholder-7.jpg', width: 1067, height: 1600, alt: 'Placeholder: a misty forest trail', caption: 'The long way down' },
  { src: '/photos/placeholder-8.jpg', width: 1600, height: 1067, alt: 'Placeholder: a misty forest trail', caption: 'Trail crew day' },
  { src: '/photos/placeholder-9.jpg', width: 1280, height: 1600, alt: 'Placeholder: a misty forest trail', caption: 'Last light' },
];
