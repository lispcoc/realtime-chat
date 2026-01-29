import Link from 'next/link'
import { intToColorCode } from "@/utils/color/color"

type UserData = {
  color: number,
  name: string
}

type Props = {
  roomId: string,
  linkName: string,
  index: number,
  isAdmin?: boolean | undefined
  users?: UserData[]
}

export default function RoomLink({ roomId, linkName, index, isAdmin = false, users = [] }: Props) {
  return (
    <li className='mb-4 text-wrap items-end space-x-2'>
      <span>
        {`${String(index).padStart(2, '0')}. `}
      </span>
      <Link className='text-blue-700 hover:border-blue-700 hover:text-blue-700 font-bold' href={{
        pathname: isAdmin ? 'adminRoom' : '/chat',
        query: { roomId: roomId },
      }}>{linkName}</Link>
      {users && users.map((user, index) => (
        <span key={index} style={{ color: intToColorCode(user.color) }} className="font-bold text-xs">
          {user.name}
        </span>
      ))}
    </li>
  )
}