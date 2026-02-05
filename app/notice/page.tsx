
import Link from "next/link"

export default function Chats() {
  return (
    <div className="w-full max-w-4xl ">
      <h2 className="text-xl font-bold pt-5 pb-5">お知らせ</h2>
      <div className="w-full pb-10">
        <h3 className="font-bold pt-5 pb-5">チャット軽量化のトライアル運用について</h3>
        <p>
          利用者増加に伴い、チャットの動作が重くなり不安定化する現象が増えてきたため、軽量化のための回収トライアルを行います。
        </p>
        <p>
          トライアルで大きな問題が出なければ正式に切り替える予定です。
        </p>
        <p>
          不具合などを発見した場合は、<Link className="font-bold text-gray-700 hover:text-blue-700" href='/report' prefetch={false}>報告フォーム</Link>よりご報告お願いします。
        </p>
        <p>
          実施予定期間：<span className="font-bold">2026/02/06 8:00 ～ 2026/02/07 8:00</span>頃
        </p>

        <h3 className="font-bold pt-5 pb-5">ルームの認証必須化について</h3>
        <p>
          ルーム作成時の認証必須化に伴って、過去に作成されて認証がされていないルームの稼働を停止します。
        </p>
        <p>
          継続してルームを利用される方は認証をお願いします。
        </p>
        <p>
          各ルームのページ下部の「部屋を編集」からGoogleアカウントでログインし、変更を反映することで認証されます。(内容を変えなくても認証されます)
        </p>
        <p>
          実施予定日：<span className="font-bold">2026/02/07</span>頃
        </p>
      </div>
      <ul>
        <li>
          停止したルームには以下の処置が行われます。
        </li>
        <li>
          ・ルームへの入室ができなくなります。
        </li>
        <li>
          ・トップページのルーム一覧に表示されなくなります。
        </li>
        <li>
          ・ルームの編集は引き続き可能です。
        </li>
        <li>
          ・2月末頃まで認証が行われない場合、ルームデータを削除します。
        </li>
      </ul>
    </div>
  )
}