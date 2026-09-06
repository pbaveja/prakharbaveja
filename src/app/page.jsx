import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Container } from '@/components/Container'
import {
  GitHubIcon,
  LinkedInIcon,
  EmailIcon,
  PhoneIcon
} from '@/components/SocialIcons'
import logoGoogle from '@/images/logos/google.svg'
import logoYourSpace from '@/images/logos/yourspace.png'
import logoHubhopper from '@/images/logos/hubhopper.png'
import logoTalentBrew from '@/images/logos/talentbrew.png'
// import image1 from '@/images/photos/image-1.jpg'
// import image2 from '@/images/photos/image-2.jpg'
// import image3 from '@/images/photos/image-3.jpg'
// import image4 from '@/images/photos/image-4.jpg'
// import image5 from '@/images/photos/image-5.jpg'
import { getAllArticles } from '@/lib/articles'
import { formatDate } from '@/lib/formatDate'

function MailIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2.75 7.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z"
        className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
      />
      <path
        d="m4 6 6.024 5.479a2.915 2.915 0 0 0 3.952 0L20 6"
        className="stroke-zinc-400 dark:stroke-zinc-500"
      />
    </svg>
  )
}

function BriefcaseIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2.75 9.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z"
        className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
      />
      <path
        d="M3 14.25h6.249c.484 0 .952-.002 1.316.319l.777.682a.996.996 0 0 0 1.316 0l.777-.682c.364-.32.832-.319 1.316-.319H21M8.75 6.5V4.75a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2V6.5"
        className="stroke-zinc-400 dark:stroke-zinc-500"
      />
    </svg>
  )
}

function ArrowDownIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.75 8.75 8 12.25m0 0 3.25-3.5M8 12.25v-8.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Article({ article }) {
  return (
    <Card as="article">
      <Card.Title href={`/articles/${article.slug}`}>
        {article.title}
      </Card.Title>
      <Card.Eyebrow as="time" dateTime={article.date} decorate>
        {formatDate(article.date)}
      </Card.Eyebrow>
      <Card.Description>{article.description}</Card.Description>
      <Card.Cta>Read article</Card.Cta>
    </Card>
  )
}

function SocialLink({ icon: Icon, ...props }) {
  return (
    <Link className="group -m-1 p-1" {...props}>
      <Icon className="h-6 w-6 fill-zinc-500 transition group-hover:fill-blue-600 dark:fill-zinc-400 dark:group-hover:fill-blue-400" />
    </Link>
  )
}

function Newsletter() {
  return (
    <form
      action="/thank-you"
      className="rounded-none border-2 border-black p-6 shadow-brutal-sm dark:border-white dark:shadow-brutal-sm-dark"
    >
      <h2 className="flex text-sm font-bold text-black dark:text-white">
        <MailIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Stay up to date</span>
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Get notified when I publish something new, and unsubscribe at any time.
      </p>
      <div className="mt-6 flex">
        <input
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          required
          className="min-w-0 flex-auto appearance-none rounded-none border-2 border-black bg-white px-3 py-[calc(theme(spacing.2)-1px)] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm dark:border-white dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-500"
        />
        <Button type="submit" className="ml-4 flex-none">
          Join
        </Button>
      </div>
    </form>
  )
}

function Role({ role }) {
  let startLabel =
    typeof role.start === 'string' ? role.start : role.start.label
  let startDate =
    typeof role.start === 'string' ? role.start : role.start.dateTime

  let endLabel = typeof role.end === 'string' ? role.end : role.end.label
  let endDate = typeof role.end === 'string' ? role.end : role.end.dateTime

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 border-b-2 border-black py-3 last:border-b-0 dark:border-white">
      <div className="flex h-8 w-8 flex-none items-center justify-center border-2 border-black bg-white dark:border-white dark:bg-zinc-800">
        <Image src={role.logo} alt="" className="h-5 w-5" unoptimized />
      </div>
      <dl className="min-w-0">
        <dt className="sr-only">Company</dt>
        <dd className="truncate text-sm font-bold text-black dark:text-white">
          {role.company}
        </dd>
        <dt className="sr-only">Role</dt>
        <dd className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {role.title}
        </dd>
      </dl>
      <dt className="sr-only">Date</dt>
      <dd
        className="flex-none whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400"
        aria-label={`${startLabel} until ${endLabel}`}
      >
        <time dateTime={startDate}>{startLabel}</time>{' '}
        <span aria-hidden="true">–</span>{' '}
        <time dateTime={endDate}>{endLabel}</time>
      </dd>
    </li>
  )
}

function Resume() {
  let resume = [
    {
      company: 'Google',
      title: 'Software Engineer',
      logo: logoGoogle,
      start: '2025',
      end: {
        label: 'Present',
        dateTime: new Date().getFullYear().toString(),
      },
    },
    {
      company: 'Hubhopper',
      title: 'Software Engineer -> Head of Tech',
      logo: logoHubhopper,
      start: '2019',
      end: '2025',
    },
    {
      company: 'Talent Brew',
      title: 'Founder',
      logo: logoTalentBrew,
      start: '2024',
      end: {
        label: 'Present',
        dateTime: new Date().getFullYear().toString(),
      },
    },
    {
      company: 'YourSpace',
      title: 'Technical Consultant',
      logo: logoYourSpace,
      start: '2021',
      end: '2023',
    },
  ]

  return (
    <div className="rounded-none border-2 border-black p-6 shadow-brutal-sm dark:border-white dark:shadow-brutal-sm-dark">
      <h2 className="flex text-sm font-bold text-black dark:text-white">
        <BriefcaseIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Work</span>
      </h2>
      <ol className="mt-6">
        {resume.map((role, roleIndex) => (
          <Role key={roleIndex} role={role} />
        ))}
      </ol>
      <Button href="https://cv.prakharbaveja.com" className="group mt-6 w-full">
        Download CV
        <ArrowDownIcon className="h-4 w-4 stroke-zinc-300 transition group-active:stroke-zinc-100 dark:stroke-zinc-400" />
      </Button>
    </div>
  )
}

function Photos() {
  let rotations = ['rotate-2', '-rotate-2', 'rotate-2', 'rotate-2', '-rotate-2']

  return (
    <div className="mt-16 sm:mt-20">
      <div className="-my-4 flex justify-center gap-5 overflow-hidden py-4 sm:gap-8">
        {[image1, image2, image3, image4, image5].map((image, imageIndex) => (
          <div
            key={image.src}
            className={clsx(
              'relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-xl bg-zinc-100 sm:w-72 sm:rounded-2xl dark:bg-zinc-800',
              rotations[imageIndex % rotations.length],
            )}
          >
            <Image
              src={image}
              alt=""
              sizes="(min-width: 640px) 18rem, 11rem"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function Home() {
  let articles = (await getAllArticles()).slice(0, 4)

  return (
    <>
      <Container className="mt-9">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-black sm:text-5xl dark:text-white">
            Prakhar Baveja
          </h1>
          <div className="mt-8 text-base">
            <p>
              <span className="text-blue-600 dark:text-blue-400">$</span>{' '}
              <span className="text-zinc-500 dark:text-zinc-500">
                cat tldr.md
              </span>
            </p>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Welcome to my corner on the web.
            </p>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              This is where I write about the software I build, the bugs
              that humble me, and what I learn along the way — mostly
              it&apos;s the output of my brain working through side
              projects, stray technical obsessions, and ideas that
              wouldn&apos;t leave me alone, plus the occasional whimsical
              detour into why the world works the way it does, and how much
              of that comes down to the tech we built to get here.
            </p>
          </div>
          <div className="mt-6 flex gap-6">
            {/* <SocialLink href="#" aria-label="Follow on X" icon={XIcon} /> */}
            <SocialLink
              href="https://github/pbaveja"
              aria-label="Follow on GitHub"
              icon={GitHubIcon}
            />
            <SocialLink
              href="https://www.linkedin.com/in/prakhar-baveja-244907106"
              aria-label="Find me on LinkedIn"
              icon={LinkedInIcon}
            />
            <SocialLink
              href="tel:9871971607"
              aria-label="Contact me"
              icon={PhoneIcon}
            />
            <SocialLink
              href="mailto:prakhar.baveja@gmail.com"
              aria-label="Email me"
              icon={EmailIcon}
            />
          </div>
        </div>
      </Container>
      {/* <Photos /> */}
      <Container className="mt-24 md:mt-28">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          <div className="flex flex-col gap-16">
            {articles.map((article) => (
              <Article key={article.slug} article={article} />
            ))}
          </div>
          <div className="space-y-10 lg:pl-16 xl:pl-24">
            {/* <Newsletter /> */}
            <Resume />
          </div>
        </div>
      </Container>
    </>
  )
}
