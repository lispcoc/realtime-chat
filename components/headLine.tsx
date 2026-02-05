import Link from 'next/link'
import styles from '@/components/style';

export default function HeadLine() {

  return (
    <>
      <Link className={`${styles.link} text-xs`} href="/notice" prefetch={false}>
        お知らせ:チャット軽量化のトライアル運用について
      </Link>
      <Link className={`${styles.link} text-xs`} href="/notice" prefetch={false}>
        お知らせ:ルームの認証必須化について
      </Link>
    </>
  )
}
