
"use client"
import { useEffect, useState } from "react"
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from "@/utils/supabase/supabase"
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import bcrypt from 'bcryptjs'
import MessageDialog from '@/components/modal';

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
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
];

export default function CreateRoom() {
  const [inputTitle, setInputTitle] = useState("")
  const [inputDecsription, setInputDescription] = useState("")
  const [inputPassword, setInputPassword] = useState("")
  const [inputRoomAllClearKey, setInputRoomAllClearKey] = useState("")
  const [inputPrivate, setInputPrivate] = useState(false)
  const [inputUseTrump, setInputUseTrump] = useState(false)
  const [autoAllClear, setAutoAllClear] = useState(false)
  const [inputUsersLimit, setInputUsersLimit] = useState<Option | null>(null);
  const [buttonDisable, setButtonDisable] = useState(false)
  const [showSpecialKeyDetail, setShowSpecialKeyDetail] = useState(false)
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
  useEffect(() => {
  }, [])

  const onSubmitCreateRoom = async (data: FormData) => {
    if (inputTitle === "") return
    if (inputPassword === "") return
    setButtonDisable(true)
    try {
      const hashedPassword = await bcrypt.hash(inputPassword, 10)
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
      const res = await supabase.from("Rooms").insert({
        title: inputTitle,
        description: inputDecsription,
        password: hashedPassword,
        options: {
          private: inputPrivate,
          auto_all_clear: autoAllClear,
          use_trump: inputUseTrump,
          user_limit: inputUsersLimit ? parseInt(inputUsersLimit.value) : 5,
          all_clear: inputRoomAllClearKey,
          variables: variable_keys
        },
        special_keys: special_keys,
        variables: variables
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
          <label htmlFor="private" className="block mb-2 text-sm font-medium text-gray-900">全員退室時にチャットログを消去する</label>
          {autoAllClear && (
            <input type="checkbox" id="autoAllClear" name="autoAllClear" onChange={(event) => setAutoAllClear(() => event.target.checked)} checked />
          )}
          {!autoAllClear && (
            <input type="checkbox" id="autoAllClear" name="autoAllClear" onChange={(event) => setAutoAllClear(() => event.target.checked)} />
          )}
        </div>

        <div className="mb-5">
          <label htmlFor="private" className="block mb-2 text-sm font-medium text-gray-900">トランプ機能を使う</label>
          {inputUseTrump && (
            <input type="checkbox" id="private" name="private" onChange={(event) => setInputUseTrump(() => event.target.checked)} checked />
          )}
          {!inputUseTrump && (
            <input type="checkbox" id="private" name="private" onChange={(event) => setInputUseTrump(() => event.target.checked)} />
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
                <label htmlFor={`roomSpecial.${index}.text`} className="block mb-2 text-sm font-medium text-gray-900">特殊テキストの設定 (<a className="text-blue-700 hover:border-blue-700 hover:text-blue-700" onClick={() => setShowSpecialKeyDetail(true)}>詳細</a>)</label>
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
          部屋を作成
        </button>
      </form>

      <MessageDialog
        open={showSpecialKeyDetail}
        onCancel={() => setShowSpecialKeyDetail(false)}
        onOk={() => setShowSpecialKeyDetail(false)}
        message={(
          <div className="mb-5">
            {`{変数}`} のように{`{}`}で変数名を囲むと変数の現在値を表示します。 (※更新のタイミング次第で正しく反映されない場合もあります)
          </div>
        )}
      />
    </div>
  )
}