import React from 'react'

// 画像未挿入の間の目印。captionに「ここにどんな画像を入れるべきか」を書いておき、
// 実際のスクリーンショットが用意でき次第、この呼び出しを<img src="..." alt={caption} />に置き換える。
export default function ImagePlaceholder({ caption }) {
  return (
    <div className="image-placeholder">
      <div className="image-placeholder-icon">🖼</div>
      <div className="image-placeholder-caption">{caption}</div>
    </div>
  )
}
