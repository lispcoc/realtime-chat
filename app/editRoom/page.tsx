
"use client"
import { Database } from "@/types/supabasetype"
import { useEffect, useState } from "react"
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from "@/utils/supabase/supabase"
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from "next/navigation"
import bcrypt from 'bcryptjs'

interface Option {
  value: string;
  label: string;
}

const schema = z.object({
  roomSpecials: z.array(
    z.object({ key: z.string(), text: z.string() })
  ),
  variables: z.array(z.object({ key: z.string() }))
});
type FormData = z.infer<typeof schema>;

const roomSpecialKeyInitialValue = { key: '', text: '' };
const USER_LIMITS: Option[] = [
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
]

export default function CreateRoom() {
  const searchParams = useSearchParams()
  let roomId = parseInt(searchParams.get("roomId")!!)
  const [inputTitle, setInputTitle] = useState("")
  const [inputDecsription, setInputDescription] = useState("")
  const [inputPassword, setInputPassword] = useState("")
  const [inputNewPassword, setInputNewPassword] = useState("")
  const [inputRoomAllClearKey, setInputRoomAllClearKey] = useState("")
  const [inputPrivate, setInputPrivate] = useState(false)
  const [autoAllClear, setAutoAllClear] = useState(false)
  const [inputUsersLimit, setInputUsersLimit] = useState<Option | null>(null);
  const [buttonDisable, setButtonDisable] = useState(false)
  const [roomData, setRoomData] = useState<Database["public"]["Tables"]["Rooms"]["Row"]>()
  const [login, setLogin] = useState(false)
  const roomSpecialTextPlaceHolder = "大吉\n中吉\n吉\n末吉\n凶"

  const { register, handleSubmit, control } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange'
  });
  const roomSpecialFieldArray = useFieldArray({
    control,
    name: 'roomSpecials'
  });
  const roomVariableFieldArray = useFieldArray({
    control,
    name: 'variables'
  });


  const onInputUsersLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    const selected = USER_LIMITS.find((option) => option.value === selectedValue);
    setInputUsersLimit(selected || null);
  };

  // 初回のみ実行するために引数に空の配列を渡している
  useEffect(() => { }, [])

  const onSubmitAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const { data } = await supabase.from("Rooms").select("*").eq('id', roomId).order("created_at")
      if (data && data[0]) {
        if (bcrypt.compareSync(inputPassword, data[0].password || "")) {
          setRoomData(data[0])
          setLogin(true)
          let tempRoomData = data[0]
          if (tempRoomData.title) {
            setInputTitle(tempRoomData.title)
          }
          if (tempRoomData.description) {
            setInputDescription(tempRoomData.description)
          }
          if (tempRoomData.special_keys) {
            for (const [key, text] of Object.entries((tempRoomData.special_keys || {}))) {
              roomSpecialFieldArray.append({ key: key, text: text })
            }
          }
          const opt: any = tempRoomData.options || {}
          if (opt.private) {
            setInputPrivate(opt.private)
          }
          if (opt.auto_all_clear) {
            setAutoAllClear(opt.auto_all_clear)
          }
          if (opt.variables) {
            for (const key of opt.variables) {
              roomVariableFieldArray.append({ key: key })
            }
          }
          setInputUsersLimit(new Option(String(opt.user_limit)))
        } else {
          alert("パスワードが違います。")
        }
      }
    } catch (error) {
      console.error(error)
      alert("認証に失敗しました。")
      return
    }
  }

  const onSubmitDeleteRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const { data } = await supabase.from("Rooms").select("*").eq('id', roomId).order("created_at")
      if (data && data[0]) {
        if (bcrypt.compareSync(inputPassword, data[0].password || "")) {
          await supabase.from("Rooms").delete().match({ "id": roomId })
          alert("部屋を削除しました。")
          window.location.href = `/`
        } else {
          alert("パスワードが違います。")
        }
      }
    } catch (error) {
      console.error(error)
      alert("認証に失敗しました。")
      return
    }
  }

  const onSubmitCreateRoom = async (data: FormData) => {
    if (inputTitle === "") return
    if (inputPassword === "") return
    setButtonDisable(true)
    try {
      const password = inputNewPassword === "" ? inputPassword : inputNewPassword
      const hashedPassword = await bcrypt.hash(password, 10)
      const special_keys: any = {}
      const variable_keys: string[] = []
      const variables: any = {}
      data.roomSpecials.forEach((value) => {
        special_keys[value.key] = value.text
      })
      data.variables.forEach((value) => {
        const trimed = value.key.trim()
        if (trimed) {
          variable_keys.push(trimed)
          variables[trimed] = 0
        }
      })
      await supabase.from("Rooms").upsert({
        id: roomData?.id,
        title: inputTitle,
        description: inputDecsription,
        password: hashedPassword,
        options: {
          private: inputPrivate,
          auto_all_clear: autoAllClear,
          user_limit: inputUsersLimit ? parseInt(inputUsersLimit.value) : 5,
          all_clear: inputRoomAllClearKey,
          variables: variable_keys
        },
        special_keys: special_keys,
        variables: variables
      })
      alert("部屋を更新しました。")
      window.location.href = `/chat?roomId=${roomId}`
    } catch (error) {
      console.error(error)
      alert("部屋の更新に失敗しました。")
      setButtonDisable(false)
    }
  }

  return (
    <div className="flex-1 w-full max-w-md flex flex-col p-2">
      <h2 className="text-xl font-bold pt-5 pb-10">ルームの編集</h2>

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
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
            <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
              認証
            </button>
          </div>
        </form>
      )}

      {login && (
        <form className="w-full max-w-md pb-10" onSubmit={handleSubmit(onSubmitCreateRoom)}>
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
            <label htmlFor="roomPassword" className="block mb-2 text-sm font-medium text-gray-900">現在のパスワード (必須)</label>
            <input
              type="password" id="roomPassword" name="roomPassword" placeholder="パスワード"
              value={inputPassword} onChange={(event) => setInputPassword(() => event.target.value)}
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="roomNewPassword" className="block mb-2 text-sm font-medium text-gray-900">新しいパスワード</label>
            <input
              type="password" id="roomNewPassword" name="roomNewPassword" placeholder="パスワード"
              value={inputNewPassword} onChange={(event) => setInputNewPassword(() => event.target.value)}
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
            <label htmlFor="private" className="block mb-2 text-sm font-medium text-gray-900">全員退室時にチャットログを消去する</label>
            {autoAllClear && (
              <input type="checkbox" id="autoAllClear" name="autoAllClear" onChange={(event) => setAutoAllClear(() => event.target.checked)} checked />
            )}
            {!autoAllClear && (
              <input type="checkbox" id="autoAllClear" name="autoAllClear" onChange={(event) => setAutoAllClear(() => event.target.checked)} />
            )}
          </div>

          <div className="mb-5">
            <label htmlFor="private" className="block mb-2 text-sm font-medium text-gray-900">入室人数制限</label>
            <select
              value={inputUsersLimit?.value || '5'}
              onChange={onInputUsersLimitChange}
            >
              {USER_LIMITS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label htmlFor="roomAllClearKey" className="block mb-2 text-sm font-medium text-gray-900">全消去キーの設定</label>
            <input type="text" id="roomAllClearKey" name="roomAllClearKey"
              placeholder="特定の発言を検知するとチャットログを消去します。(例: 全消去) 使用しない場合は空欄にしてください。"
              value={inputRoomAllClearKey} onChange={(event) => setInputRoomAllClearKey(() => event.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
          </div>

          {roomSpecialFieldArray.fields.map((field, index) => {
            const isFirstField = index === 0;
            return (
              <div className="mb-5" key={field.id}>
                <label htmlFor={`roomSpecial.${index}.key`} className="block mb-2 text-sm font-medium text-gray-900">特殊キーの設定</label>
                <input type="text"
                  placeholder="特定の発言を検知するとランダムにテキストを表示します。(例: おみくじ)"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  {...register(
                    `roomSpecials.${index}.key`
                  )}
                />
                <div className="mb-5">
                  <label htmlFor={`roomSpecial.${index}.text`} className="block mb-2 text-sm font-medium text-gray-900">特殊テキストの設定</label>
                  <textarea rows={4}
                    placeholder={roomSpecialTextPlaceHolder}
                    className="block p-2.5 w-full text-sm text-gray-900
                  bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    {...register(
                      `roomSpecials.${index}.text`
                    )}
                  />
                </div>
                {
                  !isFirstField && (
                    <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25"
                      onClick={() => roomSpecialFieldArray.remove(index)}
                    >
                      削除
                    </button>
                  )
                }
              </div>
            )
          })}
          <div className="mb-5">
            <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25"
              onClick={() => roomSpecialFieldArray.append(roomSpecialKeyInitialValue)}
            >
              特殊キーの設定追加
            </button>
          </div>

          {roomVariableFieldArray.fields.map((field, index) => {
            const isFirstField = index === 0;
            return (
              <div className="mb-5" key={field.id}>
                <label htmlFor={`variables.${index}.key`} className="block mb-2 text-sm font-medium text-gray-900">変数の設定</label>
                <input type="text"
                  placeholder="ルーム内で管理できる数値を設定します。(例:得点)"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                  focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  {...register(
                    `variables.${index}.key`
                  )}
                />
                {
                  !isFirstField && (
                    <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25"
                      onClick={() => roomVariableFieldArray.remove(index)}
                    >
                      削除
                    </button>
                  )
                }
              </div>
            )
          })}

          <div className="mb-5">
            <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25"
              onClick={() => roomVariableFieldArray.append({ key: "" })}
            >
              変数の設定追加
            </button>
          </div>

          <button type="submit" disabled={buttonDisable || inputTitle === "" || inputPassword === ""} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
            変更を反映
          </button>
        </form>
      )}

      {login && (
        <form className="w-full max-w-md pb-10" onSubmit={onSubmitDeleteRoom}>
          <button type="submit" disabled={inputPassword === ""} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
            部屋の削除
          </button>
        </form>
      )}
    </div>
  )
}