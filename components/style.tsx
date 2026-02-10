type _styles = {
    button: string
    link: string
    linkThin: string
    inputText: string
}

const styles: _styles = {
    button: 'text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25',
    link: 'text-blue-700 hover:border-blue-700 hover:text-blue-700 font-bold',
    linkThin: 'text-blue-700 hover:border-blue-700 hover:text-blue-700',
    inputText: 'text-base bg-gray-50 border border-gray-300 text-gray-900 rounded-lg  focus:ring-blue-500 focus:border-blue-500 inline-block w-full p-2.5'
}

export default styles
