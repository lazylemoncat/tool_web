/*
  TxAttachmentsSection: 附件管理 (已有 + 新增 + 移除).
*/
import React, { useRef } from 'react'
import { useLocale } from '../../../i18n'
import type { Attachment } from '../../../hooks/finance'

interface Props {
  existingAttachments: Attachment[]
  newFiles: File[]
  onRemoveExisting: (id: number) => void
  onAddFiles: (files: File[]) => void
  onRemoveNewFile: (index: number) => void
}

const TxAttachmentsSection: React.FC<Props> = ({
  existingAttachments, newFiles, onRemoveExisting, onAddFiles, onRemoveNewFile,
}) => {
  const { t } = useLocale()
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="form-group">
      <label className="form-label">{t('finance.attachments')}</label>
      {existingAttachments.length > 0 && (
        <div className="finance-attachment-list">
          {existingAttachments.map((a) => (
            <span key={a.id} className="finance-attachment-item">
              {a.url.split('/').pop()}
              <button className="finance-type-del" onClick={() => onRemoveExisting(a.id)} aria-label={t('app.delete')}>x</button>
            </span>
          ))}
        </div>
      )}
      {newFiles.length > 0 && (
        <div className="finance-attachment-list">
          {newFiles.map((f, i) => (
            <span key={i} className="finance-attachment-item">
              {f.name}
              <button className="finance-type-del" onClick={() => onRemoveNewFile(i)} aria-label={t('app.delete')}>x</button>
            </span>
          ))}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        multiple
        onChange={(e) => onAddFiles(Array.from(e.target.files || []))}
        className="finance-file-input mt-1"
      />
    </div>
  )
}

export default TxAttachmentsSection
