/**
 * Everything on the "resume bullshit" page. Replace the examples with yours.
 * Add or remove entries freely; the page renders whatever is here.
 */

export interface Job {
  role: string;
  company: string;
  /** City, or "Remote". */
  where?: string;
  start: string;
  /** Leave out for your current job. */
  end?: string;
  summary?: string;
  bullets: string[];
  tags?: string[];
}

export interface Project {
  name: string;
  blurb: string;
  link?: string;
  stack: string[];
}

export interface Education {
  school: string;
  credential: string;
  years: string;
  notes?: string;
}

export interface Resume {
  summary: string;
  experience: Job[];
  projects: Project[];
  skills: { group: string; items: string[] }[];
  education: Education[];
}

export const resume: Resume = {
  summary:
    'Replace this with two or three sentences on what you do and what you want to do next. Write it the way you’d say it at a trailhead, not the way a recruiter would.',

  experience: [
    {
      role: 'Software Developer',
      company: 'Company Name',
      where: 'City, Province',
      start: '2024',
      summary: 'One line on what the team does.',
      bullets: [
        'Start each line with what you did, then the result. Numbers help: “cut load time by 40%”.',
        'Two to four bullets per job is plenty.',
        'Keep the most impressive one first.',
      ],
      tags: ['TypeScript', 'React', 'Node'],
    },
    {
      role: 'Developer Intern',
      company: 'Another Company',
      where: 'Remote',
      start: '2023',
      end: '2023',
      bullets: ['What you built or fixed.', 'Who it helped.'],
      tags: ['Python', 'SQL'],
    },
  ],

  projects: [
    {
      name: 'This website',
      blurb: 'A portfolio you ride through. Scroll-scrubbed POV footage, physics-based coasting, and signs that stand in the forest.',
      stack: ['Next.js', 'Canvas', 'TypeScript'],
    },
    {
      name: 'Project two',
      blurb: 'One or two sentences. What it is, why you made it, what was hard.',
      link: 'https://github.com/your-handle/project',
      stack: ['Tool', 'Tool'],
    },
  ],

  skills: [
    { group: 'Languages', items: ['TypeScript', 'Python', 'SQL'] },
    { group: 'Frameworks', items: ['React', 'Next.js', 'Node'] },
    { group: 'Tools', items: ['Git', 'Figma', 'Docker'] },
    { group: 'Off the keyboard', items: ['Trail building', 'Bike maintenance', 'Photography'] },
  ],

  education: [
    {
      school: 'University Name',
      credential: 'Degree, Program',
      years: '2020 to 2025',
      notes: 'Relevant coursework, awards, clubs.',
    },
  ],
};
