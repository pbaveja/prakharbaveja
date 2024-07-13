import Image from 'next/image'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import logoHubhopper from '@/images/logos/hubhopper.png'
import logoTalentBrew from '@/images/logos/talentbrew.png'
import logoAsyncBoilerplate from '@/images/logos/async-favicon32.png'
import logoEnhans from '@/images/logos/enhans.jpg'
import logoRocket from '@/images/logos/rocket.svg'
import logoEnvelopeOpen from '@/images/logos/envelope-open.svg'
import logoArrowsRound from '@/images/logos/arrows-round.svg'

const projects = [
  {
  	name: 'TalentBrew',
  	description: 'TalentBrew is an applicant tracking system designed to streamline the hiring process and help companies find top talent quickly and efficiently. It is intended to make hiring as simple and enjoyable as brewing the perfect cup of coffee or tea.',
  	image: '/images/hh-studio.png',
  	logo: logoTalentBrew,
  	link: { href: 'https://talentbrew.in', label: 'talentbrew.in' },
  	technologyTags: ['Laravel','ReactJS','MySQL']
  },
  {
  	name: 'Hubhopper Studio',
  	description: 'A podcast hosting platform catered for the Indian creators, handling creation, RSS generation, distribution and anlytics all under one roof.',
  	image: '/images/hh-studio.png',
  	logo: logoHubhopper,
  	link: { href: 'https://studio.hubhopper.com', label: 'studio.hubhopper.com' },
  	technologyTags: ['Laravel','ReactJS','MySQL']
  },
  {
  	name: 'Hubhopper Editor',
  	description: 'Feature rich browser based audio editor where you can import, record, trim, split, fade in/out and a lot more. Inspired by the demand for easy audio manipulation.',
  	image: '/images/hh-audio-editor.png',
  	logo: logoHubhopper,
  	link: { href: 'https://studio.hubhopper.com/editor', label: 'web:editor' },
  	technologyTags: ['JavaScript']
  },
  {
  	name: 'Boilerplate MERN stack app for SAAS products.',
  	description: 'Contributed to the open source project used for SAAS platforms having the need for ACL permissions with teams/users. Using the MERN stack with NextJS.',
  	link: { href: 'https://saas-app.async-await.com/login', label: 'saas-app.async-await.com' },
  	logo: logoAsyncBoilerplate,
  	image: 'https://user-images.githubusercontent.com/26158226/61417515-2891dd00-a8ac-11e9-9c08-0d1adef43c5b.png',
  	technologyTags: ['NodeJS','MongoDB','ReactJS']
  },
  {
  	name: 'Enhans',
  	description: 'Made the porfolio website for the Enhans project that is a collaboration between 8 students from Srishti School of Art, Design and Technology and NIMHANS, dealing with doctor patient communication',
  	image: '/images/enhans-cover.png',
  	logo: logoEnhans,
  	link: { href: 'https://enhans.co.in/', label: 'enhans.co.in' },
  	technologyTags: ['ReactJS','NextJS']
  },
  {
  	name: 'HTML5 Asteroid Game',
  	description: 'Recreating the retro Asteroid game in HTML5 and JS. Intially developed by Atari.',
  	link: { href: 'https://pbaveja.github.io/HTML5-Asteroid-Game/', label: 'github.io' },
  	image: '/images/asteroids.png',
  	logo: logoRocket,
  	technologyTags: ['JavaScript']	
  },
  {
  	name: 'Node Gmail',
  	description: 'NodeJS script for all things email. Drafting, sending, listing. Integrated with the googleapis. And mail templating with nodemailer',
  	link: { href: 'https://github.com/pbaveja/node-gmail', label: 'github.io' },
   logo: logoEnvelopeOpen,
   technologyTags: ['NodeJS']
  },
  {
  	name: 'XML Parser and Podcast Episode Downloader',
  	description: 'NodeJS script for parsing an RSS into JSON and downloading all it\'s episodes into a folder. Displays progress and uses promises to avoid concurrent HTTP connections errors.',
  	link: { href: 'https://github.com/pbaveja/node-rss-parse-download', label: 'github.io' },
  	logo: logoArrowsRound,
   technologyTags: ['NodeJS']
  },
];

function LinkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M15.712 11.823a.75.75 0 1 0 1.06 1.06l-1.06-1.06Zm-4.95 1.768a.75.75 0 0 0 1.06-1.06l-1.06 1.06Zm-2.475-1.414a.75.75 0 1 0-1.06-1.06l1.06 1.06Zm4.95-1.768a.75.75 0 1 0-1.06 1.06l1.06-1.06Zm3.359.53-.884.884 1.06 1.06.885-.883-1.061-1.06Zm-4.95-2.12 1.414-1.415L12 6.344l-1.415 1.413 1.061 1.061Zm0 3.535a2.5 2.5 0 0 1 0-3.536l-1.06-1.06a4 4 0 0 0 0 5.656l1.06-1.06Zm4.95-4.95a2.5 2.5 0 0 1 0 3.535L17.656 12a4 4 0 0 0 0-5.657l-1.06 1.06Zm1.06-1.06a4 4 0 0 0-5.656 0l1.06 1.06a2.5 2.5 0 0 1 3.536 0l1.06-1.06Zm-7.07 7.07.176.177 1.06-1.06-.176-.177-1.06 1.06Zm-3.183-.353.884-.884-1.06-1.06-.884.883 1.06 1.06Zm4.95 2.121-1.414 1.414 1.06 1.06 1.415-1.413-1.06-1.061Zm0-3.536a2.5 2.5 0 0 1 0 3.536l1.06 1.06a4 4 0 0 0 0-5.656l-1.06 1.06Zm-4.95 4.95a2.5 2.5 0 0 1 0-3.535L6.344 12a4 4 0 0 0 0 5.656l1.06-1.06Zm-1.06 1.06a4 4 0 0 0 5.657 0l-1.061-1.06a2.5 2.5 0 0 1-3.535 0l-1.061 1.06Zm7.07-7.07-.176-.177-1.06 1.06.176.178 1.06-1.061Z"
        fill="currentColor"
      />
    </svg>
  )
}

export const metadata = {
  title: 'Projects',
  description: 'The completed projects, works in progress, those unfortunately sidelined, and all other projects I’ve worked on.',
}

export default function Projects() {
  return (
    <SimpleLayout
      title="The completed projects, works in progress, those unfortunately sidelined, and all other projects I’ve worked on."
      intro="I’ve worked on tons of little projects over the years but these are the ones that are somewhat worth showcasing. Some of them are open source, so if you see something that piques your interest, check out the code let me know what you think."
    >
      <ul
        role="list"
        className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
      >
        {projects.map((project) => (
          <Card as="li" key={project.name}>
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0">
              <Image
                src={project.logo}
                alt=""
                className="h-8 w-8"
                unoptimized
              />
            </div>
            <h2 className="mt-6 text-base font-semibold text-zinc-800 dark:text-zinc-100">
              <Card.Link href={project.link.href}>{project.name}</Card.Link>
            </h2>
            <Card.Description>{project.description}</Card.Description>
            <p className="relative z-10 mt-6 flex text-sm font-medium text-zinc-400 transition group-hover:text-blue-500 dark:text-zinc-200">
              <LinkIcon className="h-6 w-6 flex-none" />
              <span className="ml-2">{project.link.label}</span>
            </p>
          </Card>
        ))}
      </ul>
    </SimpleLayout>
  )
}
