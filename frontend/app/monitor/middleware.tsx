'use server'
import { chackAdminInServer } from './server'

export async function chackAdmin() {
  console.log('chackAdmin called')
  const res = await chackAdminInServer()
  console.log('chackAdmin result:', res)
  return await chackAdminInServer()
}
