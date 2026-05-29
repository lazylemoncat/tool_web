/*
  ManagePage: 记账基础数据管理, 承接分类与标签配置.
*/
import React from 'react'
import { useOutletContext } from 'umi'
import type { FinanceContext } from './FinanceLayout'
import CategoryManager from '../../components/finance/CategoryManager'
import TagManager from '../../components/finance/TagManager'

const ManagePage: React.FC = () => {
  const ctx = useOutletContext<FinanceContext>()

  return (
    <div className="finance-manage-page">
      <div className="dashboard-management-links">
        <CategoryManager
          categories={ctx.categories}
          onCreate={ctx.handleCreateCategory}
          onUpdate={ctx.handleUpdateCategory}
          onDelete={ctx.handleDeleteCategory}
        />
        <TagManager tags={ctx.tags} onCreate={ctx.handleCreateTag} onDelete={ctx.handleDeleteTag} />
      </div>
    </div>
  )
}

export default ManagePage
