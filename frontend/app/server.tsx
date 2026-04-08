'use server'
import { cookies } from 'next/headers'

export const getCookie = async (key: string) => {
    return JSON.stringify((await cookies()).get(key))
}
