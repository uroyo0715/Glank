import React, { useState } from 'react'

const NEW_TAG_VALUE = '__new__'

/**
 * 種類（タグ）は1件の報告に複数付けられる。既存タグ（このプロジェクトで実際に使われたことのある
 * ものと、「入力項目の管理」で追加したプリセット）はリスト（セレクトボックス）から選ぶ。
 * リストに無い新しいタグを付けたい場合は「＋ 新しいタグ」を選ぶと、これまで通り自由入力できる。
 * 選択済みは上部にチップで表示し、×で個別に外せる。
 */
export default function TagMultiField({ value, onChange, options, hiddenValues, manualPlaceholder }) {
  const [manualInput, setManualInput] = useState('')
  const [addingNew, setAddingNew] = useState(false)

  const visibleOptions = options.filter(
    (opt) => value.includes(opt.value) || !hiddenValues?.includes(opt.value)
  )
  // 既に付いているタグをリストに出しても選びようがないので、まだ付けていないものだけ出す。
  const selectableOptions = visibleOptions.filter((opt) => !value.includes(opt.value))

  function remove(v) {
    onChange(value.filter((x) => x !== v))
  }

  function labelFor(v) {
    return options.find((o) => o.value === v)?.label ?? v
  }

  function handleSelectChange(e) {
    const v = e.target.value
    e.target.value = '' // 選択のたびにプレースホルダーへ戻す（この<select>自体は状態を持たない操作メニュー）
    if (v === NEW_TAG_VALUE) {
      setAddingNew(true)
      return
    }
    if (!v || value.includes(v)) return
    onChange([...value, v])
  }

  function addManual() {
    const v = manualInput.trim()
    if (!v || value.includes(v)) return
    onChange([...value, v])
    setManualInput('')
    setAddingNew(false)
  }

  function cancelManual() {
    setManualInput('')
    setAddingNew(false)
  }

  return (
    <div className="tag-multi-field">
      {value.length > 0 && (
        <div className="tag-multi-selected">
          {value.map((v) => (
            <span className="tag-multi-chip" key={v}>
              {labelFor(v)}
              <button type="button" onClick={() => remove(v)} aria-label={`${labelFor(v)}を外す`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {!addingNew ? (
        <select className="tag-multi-select" value="" onChange={handleSelectChange}>
          <option value="" disabled>
            タグを選択...
          </option>
          {selectableOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          <option value={NEW_TAG_VALUE}>＋ 新しいタグ</option>
        </select>
      ) : (
        // 種類の追加行は<form>にしない。この要素自体が報告フォーム（<form>）の中に置かれるため、
        // <form>を入れ子にすると送信イベントが外側のフォームまでバブルして二重送信を起こす
        // （実際にこれが原因で「新規報告」画面から強制的にプロジェクト一覧へ戻る不具合が起きた）。
        <div className="tag-multi-add">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault() // 外側の報告フォームが送信されてしまうのを防ぐ
              addManual()
            }}
            placeholder={manualPlaceholder}
            autoFocus
          />
          <button type="button" onClick={addManual} disabled={!manualInput.trim()}>
            追加
          </button>
          <button type="button" className="tag-multi-cancel" onClick={cancelManual}>
            キャンセル
          </button>
        </div>
      )}
    </div>
  )
}
