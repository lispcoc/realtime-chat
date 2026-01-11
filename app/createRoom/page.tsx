
"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import bcrypt from 'bcryptjs'

export default function CreateRoom() {
  const [inputTitle, setInputTitle] = useState("")
  const [inputDecsription, setInputDescription] = useState("")
  const [inputPassword, setInputPassword] = useState("")

  // 初回のみ実行するために引数に空の配列を渡している
  useEffect(() => { }, [])

  const onSubmitCreateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputTitle === "") return
    if (inputDecsription === "") return
    try {
      let maxId = 0
      const { data } = await supabase.from("Rooms").select("*")
      if (data) {
        data?.forEach(room => {
          if (maxId <= room.id) {
            maxId = room.id + 1
          }
        })
      }
      const hashedPassword = await bcrypt.hash(inputPassword, 10)
      await supabase.from("Rooms").insert({ id: maxId, title: inputTitle, description: inputDecsription, password: hashedPassword, options: {}, special_keys: {} })
      alert("部屋を作成しました。")
    } catch (error) {
      console.error(error)
      alert("部屋の作成に失敗しました。")
    }
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center p-2">
      <h1 className="text-3xl font-bold pt-5 pb-10">ルームの作成</h1>

      <form className="w-full max-w-md pb-10" onSubmit={onSubmitCreateRoom}>
        <div className="mb-5">
          <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900">ルーム名</label>
          <input type="text" id="title" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            name="title" value={inputTitle} onChange={(event) => setInputTitle(() => event.target.value)}></input>
        </div>
        <div className="mb-5">
          <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900">ルーム説明</label>
          <textarea id="description" name="description" rows={4} className="block p-2.5 w-full text-sm text-gray-900
                 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            placeholder="投稿内容を入力" value={inputDecsription} onChange={(event) => setInputDescription(() => event.target.value)}>
          </textarea>
        </div>
        <label htmlFor="roomPassword">パスワード (必須)</label>
        <input
          type="password"
          id="roomPassword"
          name="roomPassword"
          placeholder="パスワード"
          value={inputPassword} onChange={(event) => setInputPassword(() => event.target.value)}
          required
        />
        <button type="submit" disabled={inputTitle === "" || inputPassword === ""} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
          作成
        </button>
      </form>
    </div>
  )
}