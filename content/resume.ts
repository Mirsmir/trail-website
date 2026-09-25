/**
 * Everything on the "resume bullshit" page
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
    'trying to land a job',

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
    { group: 'Languages', items: ['C++', 'Python', 'Verilog', 'MATLAB', 'JavaScript', 'Java', 'SQL'] },
    { group: 'DevOps', items: ['Git', 'Jira', 'Jenkins', 'Google Cloud Platform', 'Apache Subversion'] },
    { group: 'Tools', items: ['KiCad', 'LTSpice', 'Intel Quartus', 'ModelSim', 'WinDbg', 'Latex'] },
    { group: 'Libs and Protocols', items: ['TensorFlow', 'OpenCV', 'Mediapipe', 'Component Object Model', 'Active Template Library'] },
    { group: 'Hardware', items: ['Altera MAX10 FPGA', 'ESP32', 'Arduino', 'Raspberry Pi'] }
  ],

  education: [
    {
      school: 'University of Waterloo',
      credential: 'Electrical  & Computer Engineering, BCs',
      years: '2025 - 2030',
      notes: 'Rocketry, EngSoc, Academic Rep',
    },
  ],
};
