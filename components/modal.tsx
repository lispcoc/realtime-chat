import React from 'react';
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
                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25"
                                onClick={() => props.onOk()}
                            >
                                OK
                            </button>
                            {props.showCancel && (
                                <button
                                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25"
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