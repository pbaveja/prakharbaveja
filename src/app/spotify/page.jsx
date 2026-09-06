import Image from 'next/image'

import { SimpleLayout } from '@/components/SimpleLayout'

import { getPlaylists, getTopTracks } from '@/lib/spotify'

export const metadata = {
  title: 'Spotify x Me',
  description:
    'Some of my playlists that I listen to regularly. Rendered directly from Spotify\'s API.',
}


async function getData() {
  const playlists = await getPlaylists(['55kaalmMfuanMgINNafOQ8', '30tkKoZrd8MFpmp6a6Uz0l', '53JEaESR7YzMhfK3I8WEan', '1qGVxjrbNySEhHh8MzGo8c', '31zXwTpdIj9B44kPELqU9o'])
  // const tracks = await getTopTracks()
  return { playlists }
}

export default async function Spotify() {
  const data = await getData()
  const playlists = data.playlists;
  // const tracks = data.tracks;
  
  // console.log(tracks)
  return (
    <SimpleLayout
      title="Spotify x Me"
      intro="Some of my playlists that I listen to regularly. Rendered directly from Spotify's API."
    >
      <div className="space-y-20">
        <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {
         playlists && playlists.map(playlist => (
            <li
              key={playlist.id}
              className="col-span-1 flex flex-col rounded-md border-2 border-zinc-900 bg-white text-center shadow-brutal-sm transition hover:-translate-x-px hover:-translate-y-px hover:shadow-brutal dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-brutal-sm-dark dark:hover:shadow-brutal-dark"
            >
              <div className="flex flex-1 flex-col p-8">
                <Image alt="" width={playlist.images[0].width} height={playlist.images[0].height} src={playlist.images[0].url} className="mx-auto h-32 w-32 lg:h-48 lg:w-48 flex-shrink-0 rounded-md" />  
                <h3 className="mt-6 text-sm font-medium text-gray-900 dark:text-gray-200">{playlist.name}</h3>
                <dl className="mt-1 flex flex-grow flex-col justify-between">
                  <dd className="text-sm text-gray-500 dark:text-gray-400">{playlist.description}</dd>
                  {/* <dd className="mt-3">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Play
                    </span>
                  </dd> */}
                </dl>
              </div>
              <div>
                <div className="flex items-center select-none cursor-pointer border-t-2 border-zinc-900 dark:border-zinc-100">
                  <div className="flex w-0 flex-1">
                    <a
                      target='_blank'
                      href={`${playlist.external_urls.spotify}`}
                      className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 border-r-2 border-zinc-900 py-4 text-sm font-semibold text-gray-900 dark:border-zinc-100 dark:text-gray-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                      </svg>
                      Play
                    </a>
                  </div>
                  <div className="flex w-0 flex-1">
                    <a
                      target='_blank'
                      href={`${playlist.external_urls.spotify}`}
                      className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 py-4 text-sm font-semibold text-gray-900 dark:text-gray-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Follow
                    </a>
                  </div>
                </div>
              </div>
            </li>
          ))
        }
        </ul>
      </div>
    </SimpleLayout>
  )
}