'use server'
import { addReport } from "./server"

export async function handleSubmit(formData: FormData) {
    const name = formData.get('name')?.toString()
    const text = formData.get('text')?.toString()
    const res = addReport(name || 'Unknown', text || '')
    return res
}
