import Link from 'next/link'

type Props = {
  roomId: string,
  linkName: string,
  index: number
}

export default function RoomLink({ roomId, linkName, index }: Props) {
  return (
    <li className='mb-4'>
      <span>
        {`${String(index).padStart(2, '0')}. `}
      </span>
      <Link className='text-blue-700 hover:border-blue-700 hover:text-blue-700' href={{
        pathname: '/chat',
        query: { roomId: roomId },
      }}>{linkName}</Link>
    </li>
  )
}