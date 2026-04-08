import React from 'react';
import styles from '@/components/style'
import Link from 'next/link'
import './modal.css'

export type ModalProps = {
    open: boolean;
    showCancel?: boolean;
    onCancel: () => void;
    onOk: () => void;
    message: React.JSX.Element
};

const Modal = (props: ModalProps) => {
    let noClose = false
    return props.open ? (
        <>
            <div className="overlay"
                onClick={() => { if (!noClose) props.onCancel(); noClose = false }}>
                <div className="flex justify-center items-center w-screen h-screen">
                    <div className="bg-white w-full max-w-xl border border-gray-300 p-4 rounded-lg z-20" onClick={() => { noClose = true }}>
                        <div className="block mb-4">
                            {props.message}
                        </div>
                        <div className="block flex justify-center space-x-2">
                            <button
                                className={styles.button}
                                onClick={() => props.onOk()}
                            >
                                OK
                            </button>
                            {props.showCancel && (
                                <button
                                    className={styles.button}
                                    onClick={() => props.onCancel()}
                                >
                                    キャンセル
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    ) : (
        <></>
    );
};

export default Modal;