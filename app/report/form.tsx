'use client'
import styles from '@/components/style'
import { handleSubmit } from './server'

export default function Form() {
  const handleSubmitClient = async (formData: FormData) => {
    const result = await handleSubmit(formData)
    if (result) {
      alert('送信が完了しました。')
    } else {
      alert('送信に失敗しました。')
    }
  }

  return (
    <div className="w-full max-w-xl">
      <h2 className="text-xl font-bold pt-5 pb-5">不具合報告フォーム</h2>
      <form action={handleSubmitClient}>
        <div className='block'>
          <label htmlFor='name'>名前</label>
          <input className={`${styles.inputText}`} name="name" type="text" />
        </div>
        <div className='block'>
          <label htmlFor='text'>内容</label>
          <textarea rows={4} className={`${styles.inputText}`} name="text" />
        </div>
        <button className={styles.button} type="submit">送信</button>
      </form>
    </div>
  )
}
