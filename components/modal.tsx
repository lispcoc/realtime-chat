import React from 'react';

export type ModalProps = {
    open: boolean;
    onCancel: () => void;
    onOk: () => void;
    message: React.JSX.Element
};

const Modal = (props: ModalProps) => {
    let noClose = false
    return props.open ? (
        <>
            <div className="flex justify-center items-center w-screen h-screen"
                onClick={() => { if (!noClose) props.onCancel(); noClose = false }}>
                <div className="bg-white w-full max-w-xl border border-gray-300 p-4 rounded-lg z-20" onClick={() => { noClose = true }}>
                    <div className="block mb-4">
                        {props.message}
                    </div>
                    <div className="block flex justify-center">
                        <button
                            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25"
                            onClick={() => props.onOk()}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </>
    ) : (
        <></>
    );
};

export default Modal;