
"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import bcrypt from 'bcryptjs'

export default function CreateRoom() {
  const [inputTitle, setInputTitle] = useState("")
  const [inputDecsription, setInputDescription] = useState("")
  const [inputPassword, setInputPassword] = useState("")
  const [inputRoomSpecialKey_1, setInputRoomSpecialKey_1] = useState("")
  const [inputRoomSpecialText_1, setInputRoomSpecialText_1] = useState("")
  const [inputPrivate, setInputPrivate] = useState(false)
  const [buttonDisable, setButtonDisable] = useState(false)
  const roomSpecialTextPlaceHolder = "大吉\n中吉\n吉\n末吉\n凶"


  // 初回のみ実行するために引数に空の配列を渡している
  useEffect(() => { }, [])

  const onSubmitCreateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputTitle === "") return
    if (inputPassword === "") return
    setButtonDisable(true)
    try {
      const hashedPassword = await bcrypt.hash(inputPassword, 10)
      const special_keys: any = {}
      special_keys[inputRoomSpecialKey_1] = inputRoomSpecialText_1
      const res = await supabase.from("Rooms").insert({
        title: inputTitle,
        description: inputDecsription,
        password: hashedPassword,
        options: {
          private: inputPrivate
        },
        special_keys: special_keys
      }).select('*')
      alert("部屋を作成しました。")
      if (res.data && res.data[0]) {
        window.location.href = `/chat?roomId=${res.data[0].id}`
      } else {
        window.location.href = '/'
      }
    } catch (error) {
      console.error(error)
      alert("部屋の作成に失敗しました。")
      setButtonDisable(false)
    }
  }

  return (
    <div className="flex-1 w-full max-w-md flex flex-col p-2">
      <h2 className="text-xl font-bold pt-5 pb-10">ルームの作成</h2>

      <form className="w-full max-w-md pb-10" onSubmit={onSubmitCreateRoom}>
        <div className="mb-5">
          <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900">ルーム名</label>
          <input type="text" id="title" name="title"
            value={inputTitle} onChange={(event) => setInputTitle(() => event.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          />
        </div>

        <div className="mb-5">
          <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900">ルーム説明</label>
          <textarea id="description" name="description" rows={4}
            className="block p-2.5 w-full text-sm text-gray-900
              bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            placeholder="" value={inputDecsription} onChange={(event) => setInputDescription(() => event.target.value)}>
          </textarea>
        </div>

        <div className="mb-5">
          <label htmlFor="roomPassword" className="block mb-2 text-sm font-medium text-gray-900">パスワード (必須)</label>
          <input
            type="password" id="roomPassword" name="roomPassword" placeholder="パスワード"
            value={inputPassword} onChange={(event) => setInputPassword(() => event.target.value)}
            required
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          />
        </div>

        <div className="mb-5">
          <label htmlFor="private" className="block mb-2 text-sm font-medium text-gray-900">未入室の閲覧を禁止する</label>
          {inputPrivate && (
            <input type="checkbox" id="private" name="private" onChange={(event) => setInputPrivate(() => event.target.checked)} checked />
          )}
          {!inputPrivate && (
            <input type="checkbox" id="private" name="private" onChange={(event) => setInputPrivate(() => event.target.checked)} />
          )}
        </div>

        <div className="mb-5">
          <label htmlFor="roomSpecialKey_1" className="block mb-2 text-sm font-medium text-gray-900">特殊キーの設定</label>
          <input type="text" id="roomSpecialKey_1" name="roomSpecialKey_1"
            placeholder="特定の発言を検知するとランダムにテキストを表示します。(例: おみくじ)"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
            focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            value={inputRoomSpecialKey_1}
            onChange={(event) => setInputRoomSpecialKey_1(() => event.target.value)}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="roomSpecialText_1" className="block mb-2 text-sm font-medium text-gray-900">特殊テキストの設定</label>
          <textarea id="roomSpecialText_1" name="roomSpecialText_1" rows={4}
            placeholder={roomSpecialTextPlaceHolder}
            className="block p-2.5 w-full text-sm text-gray-900
            bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            value={inputRoomSpecialText_1}
            onChange={(event) => setInputRoomSpecialText_1(() => event.target.value)}
          />
        </div>

        <button type="submit" disabled={buttonDisable || inputTitle === "" || inputPassword === ""} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
          部屋を作成
        </button>
      </form>
    </div>
  )
}