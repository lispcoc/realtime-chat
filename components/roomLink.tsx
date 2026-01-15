import Link from 'next/link'

type Props = {
  roomId: string,
  linkName: string,
  index: number,
  isAdmin?: boolean | undefined
}

export default function RoomLink({ roomId, linkName, index, isAdmin = false }: Props) {
  return (
    <li className='mb-4'>
      <span>
        {`${String(index).padStart(2, '0')}. `}
      </span>
      <Link className='text-blue-700 hover:border-blue-700 hover:text-blue-700' href={{
        pathname: isAdmin ? 'adminRoom' : '/chat',
        query: { roomId: roomId },
      }}>{linkName}</Link>
    </li>
  )
}