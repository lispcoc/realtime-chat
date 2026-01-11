import Link from 'next/link'

type Props = {
  roomId: string,
  linkName: string,
}

export default function RoomLink({ roomId, linkName }: Props) {
  return (
    <li className='mb-4'>
      <Link className='text-gray-700 border-b-2 border-gray-700 hover:border-blue-700 hover:text-blue-700 text-xl' href={{
        pathname: '/chat',
        query: { roomId: roomId },
      }}>{linkName}</Link>
    </li>
  )
}