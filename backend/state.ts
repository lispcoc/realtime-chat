/**
 * state.ts
 * サーバーのインメモリ状態をファイルに永続化する。
 * 保存対象: users (ルーム在室者マップ)
 */

import { Database } from './supabasetype.ts'

type User = Database["public"]["Tables"]["Users"]["Row"]

const STATE_FILE = './state.json'

// ---- シリアライズ -------------------------------------------------------

/** users Map を JSON シリアライズ可能なオブジェクトに変換 */
function serializeUsers(
  users: Map<number, Map<string, User>>
): Record<string, Record<string, User>> {
  const obj: Record<string, Record<string, User>> = {}
  for (const [roomId, roomUsers] of users) {
    obj[String(roomId)] = Object.fromEntries(roomUsers)
  }
  return obj
}

/** JSON オブジェクトを users Map に復元 */
function deserializeUsers(
  obj: Record<string, Record<string, User>>
): Map<number, Map<string, User>> {
  const users = new Map<number, Map<string, User>>()
  for (const [roomIdStr, roomUsersObj] of Object.entries(obj)) {
    const roomId = parseInt(roomIdStr)
    const roomUsers = new Map<string, User>(Object.entries(roomUsersObj))
    users.set(roomId, roomUsers)
  }
  return users
}

// ---- 保存 ---------------------------------------------------------------

/**
 * 現在の状態をファイルに保存する。
 * 呼び出し側での await は任意（失敗しても処理を止めない）。
 */
export async function saveState(
  users: Map<number, Map<string, User>>
): Promise<void> {
  try {
    const payload = {
      savedAt: new Date().toISOString(),
      users: serializeUsers(users),
    }
    await Deno.writeTextFile(STATE_FILE, JSON.stringify(payload, null, 2))
  } catch (err) {
    console.error('[state] 保存失敗:', err)
  }
}

// ---- 読み込み ------------------------------------------------------------

export type RestoredState = {
  users: Map<number, Map<string, User>>
}

/**
 * ファイルから状態を復元して返す。
 * ファイルが存在しない場合や壊れている場合は空の状態を返す。
 */
export async function loadState(): Promise<RestoredState> {
  try {
    const text = await Deno.readTextFile(STATE_FILE)
    const payload = JSON.parse(text)
    const users = deserializeUsers(payload.users ?? {})
    const count = [...users.values()].reduce((s, m) => s + m.size, 0)
    console.log(`[state] 復元完了 (savedAt=${payload.savedAt}, users=${count})`)
    return { users }
  } catch (err) {
    // ファイルが存在しない場合は正常 (初回起動)
    if (!(err instanceof Deno.errors.NotFound)) {
      console.error('[state] 読み込み失敗 (空の状態で起動):', err)
    }
    return { users: new Map() }
  }
}

// ---- デバウンス付き保存 -------------------------------------------------

let _saveTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 状態をデバウンス付きで保存する。
 * 短時間に複数回呼ばれても最後のコールから 2 秒後に 1 回だけ書き込む。
 */
export function scheduleSave(users: Map<number, Map<string, User>>): void {
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    saveState(users)
    _saveTimer = null
  }, 2000)
}
