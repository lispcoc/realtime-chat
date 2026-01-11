
"use client"
import { Database } from "@/types/supabasetype"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import { useSearchParams } from "next/navigation"
import bcrypt from 'bcryptjs'

export default function CreateRoom() {
  const searchParams = useSearchParams()
  let roomId = parseInt(searchParams.get("roomId")!!)
  const [inputTitle, setInputTitle] = useState("")
  const [inputDecsription, setInputDescription] = useState("")
  const [inputPassword, setInputPassword] = useState("")
  const [inputRoomSpecialKey_1, setInputRoomSpecialKey_1] = useState("")
  const [inputRoomSpecialText_1, setInputRoomSpecialText_1] = useState("")
  const [roomData, setRoomData] = useState<Database["public"]["Tables"]["Rooms"]["Row"]>()
  const [login, setLogin] = useState(false)


  // 初回のみ実行するために引数に空の配列を渡している
  useEffect(() => { }, [])

  const onSubmitAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const hashedPassword = await bcrypt.hash(inputPassword, 10)
      const { data } = await supabase.from("Rooms").select("*").eq('id', roomId).order("created_at")
      if (data && data[0]) {
        if (data[0].password === hashedPassword) {
          setRoomData(data[0])
          setLogin(true)
          if (roomData?.title) {
            setInputTitle(roomData?.title)
          }
          if (roomData?.description) {
            setInputDescription(roomData?.description)
          }
          if (roomData?.options) {
            setInputRoomSpecialKey_1(Object.keys((roomData?.options as Object))[0] || "")
            setInputRoomSpecialText_1(Object.values((roomData?.options as Object))[0] || "")
          }
        }
      }
    } catch (error) {
      console.error(error)
      alert("認証に失敗しました。")
      return
    }
  }

  const onSubmitCreateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputTitle === "") return
    if (inputDecsription === "") return
    try {
      const hashedPassword = await bcrypt.hash(inputPassword, 10)
      const special_keys: any = {}
      special_keys[inputRoomSpecialKey_1] = inputRoomSpecialText_1
      await supabase.from("Rooms").upsert({
        id: roomData?.id,
        title: inputTitle,
        description: inputDecsription,
        password: hashedPassword,
        options: {},
        special_keys: special_keys
      })
      alert("部屋を作成しました。")
    } catch (error) {
      console.error(error)
      alert("部屋の作成に失敗しました。")
    }
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center p-2">
      <h1 className="text-3xl font-bold pt-5 pb-10">ルームの作成</h1>

      {!login && (
        <form className="w-full max-w-md pb-10" onSubmit={onSubmitAdmin}>
          <div className="mb-5">
            <label htmlFor="roomPassword">パスワード</label>
            <input
              type="password"
              id="roomPassword"
              name="roomPassword"
              placeholder="パスワード"
              value={inputPassword} onChange={(event) => setInputPassword(() => event.target.value)}
              required
            />
            <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
              認証
            </button>
          </div>
        </form>
      )}

      {login && (
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
              placeholder="" value={inputDecsription} onChange={(event) => setInputDescription(() => event.target.value)}>
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

          <label htmlFor="roomSpecialKey_1">特殊キーの設定</label>
          <input type="text" id="roomSpecialKey_1" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            name="roomSpecialKey_1" value={inputRoomSpecialKey_1} onChange={(event) => setInputRoomSpecialKey_1(() => event.target.value)}></input>

          <label htmlFor="roomSpecialText_1">特殊テキストの設定</label>
          <textarea id="roomSpecialText_1" name="roomSpecialText_1" rows={4} className="block p-2.5 w-full text-sm text-gray-900
                 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            placeholder="投稿内容を入力" value={inputRoomSpecialText_1} onChange={(event) => setInputRoomSpecialText_1(() => event.target.value)}>
          </textarea>

          <button type="submit" disabled={inputTitle === "" || inputPassword === ""} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
            変更を反映
          </button>
        </form>
      )}
    </div>
  )
}