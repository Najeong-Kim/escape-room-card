import { useMemo } from 'react'
import { Create, SimpleForm, useGetList } from 'react-admin'
import { RoomFormFields } from './RoomForm'

const useNextRoomId = () => {
  const { data } = useGetList('rooms', {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: 'id', order: 'DESC' },
  })

  return useMemo(() => {
    if (!data?.length) return 'room-001'
    const maxNum = data.reduce((max, room) => {
      const match = (room.id as string).match(/^room-(\d+)$/)
      return match ? Math.max(max, parseInt(match[1])) : max
    }, 0)
    return `room-${String(maxNum + 1).padStart(3, '0')}`
  }, [data])
}

export const RoomCreate = () => {
  const nextId = useNextRoomId()

  return (
    <Create>
      <SimpleForm defaultValues={{ id: nextId }}>
        <RoomFormFields />
      </SimpleForm>
    </Create>
  )
}
