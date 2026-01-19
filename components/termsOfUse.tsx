"use client"
import { useEffect, useState } from "react"
import React from 'react';
import './modal.css'

const lastUpdate = "2026-01-19T00:00:00.000Z"

const TermsOfUse = () => {
  const [agree, setAgree] = useState(false)
  const [close, setClose] = useState(true)

  const onAgree = () => {
    localStorage.setItem('agreeDate', lastUpdate)
    setClose(true)
  }

  useEffect(() => {
    const date = localStorage.getItem('agreeDate') || ""
    console.log(date)
    if (!alreadyAgree()) {
      setClose(false)
    }
  }, [])

  const alreadyAgree = () => {
    let agreeDate: number = 0
    const agreeDateStr = localStorage.getItem('agreeDate') || ""
    if (agreeDateStr) {
      agreeDate = Date.parse(agreeDateStr)
      if (agreeDate >= Date.parse(lastUpdate)) {
        return true
      }
    }
    return false
  }

  return (
    <>
      {!close && (
        <div className="overlay bg-white">
          <div className="bg-white flex justify-center items-center w-screen h-screen">
            <div className="w-full max-w-4xl ">
              <h2 className="text-xl font-bold pt-5 pb-5">利用規約</h2>
              <ul>
                <li>
                  ・当サイトは18才未満の利用を禁止しています。
                </li>
                <li>
                  ・当サイトは出会い系サイトではありません。 当サイト内で男女が個別に連絡先のやり取りをすることを禁止します。
                </li>
                <li>
                  ・荒らし行為、個人を中傷する行為、他者のプライバシーを侵害する行為を禁止します。
                </li>
                <li>
                  ・法律、条例に反する行為を禁止します。
                </li>
                <li>
                  ・違反のある場合は、アクセス制限、及び、プロバイダ、警察への通報の対象となります。
                </li>
                <li>
                  ・不正利用者についてはアクセス元情報を公開することがあります。
                </li>
                <li>
                  ・当サイトは利用者同士のトラブルに関知いたしません。
                </li>
                <li>
                  ・当サイトのチャットログを他の掲示板サイト等に転載することを禁止します。
                </li>
                <li>
                  ※本メッセージが繰り返し表示される場合は、ブラウザのCookie機能を有効化してください。
                </li>
              </ul>
              <div className="">
                <input type="checkbox" id="agree" name="agree" onChange={(event) => setAgree(() => event.target.checked)} />
                18歳以上であり、上記のすべてに同意する。
                <button
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25"
                  disabled={!agree}
                  onClick={() => { if (agree) { onAgree() } }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TermsOfUse;