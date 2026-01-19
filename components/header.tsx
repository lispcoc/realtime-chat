
"use client"
import { useEffect, useState } from "react"
import Link from 'next/link'
import MessageDialog from '@/components/modal';
import TermsOfUse from '@/components/termsOfUse';

export default function Header() {
    const [messageDialogOpen, setMessageDialogOpen] = useState(false);
    const [showTermsOfUse, setShowTermsOfUse] = useState(false);

    return (
        <header className="p-4 border-b-2 border-gray-300 fixed w-full">
            <ul className="w-full max-w-xl m-auto flex space-x-4 font-medium flex-row">
                <li>
                    <Link className="text-gray-700 hover:text-blue-700" href="/">Home</Link>
                </li>
                <li>
                    <Link className="text-gray-700 hover:text-blue-700" href="/createRoom">部屋の作成</Link>
                </li>
                <li>
                    <span className="text-gray-700 hover:text-blue-700" onClick={(e) => setMessageDialogOpen(true)}>機能説明</span>
                </li>
                <li>
                    <span className="text-gray-700 hover:text-blue-700" onClick={(e) => setShowTermsOfUse(true)}>利用規約</span>
                </li>
            </ul>

            {showTermsOfUse && (
                <TermsOfUse forceShow={true} onClose={() => setShowTermsOfUse(false)} />
            )}

            <MessageDialog
                open={messageDialogOpen}
                onCancel={() => setMessageDialogOpen(false)}
                onOk={() => setMessageDialogOpen(false)}
                message={(
                    <div>
                        サイコロ機能について：<br />
                        チャット中に「2d6」と発言すると、6面のサイコロ二つを振ります。「2d6+3」のように+x補正も可能です。<br />
                        <br />
                        トリップについて：<br />
                        「名前#key」のように「#」のあとに文字列を指定して入室すると名前にランダムな文字列が付与されます。本人確認などに使用できます。<br />
                    </div>
                )}
            />
        </header>
    )
}