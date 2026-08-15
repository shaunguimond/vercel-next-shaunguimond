import styles from './post-body.module.css'
import { sanitizeWpContent } from '../lib/sanitize'

export default function PostBody({ content }) {
  return (
    <div className='post-body mx-5'>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: sanitizeWpContent(content) }}
      />
    </div>
  )
}
