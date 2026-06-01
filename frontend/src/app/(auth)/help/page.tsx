'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const FAQS = [
  { q: '如何创建新的任务?', a: '在 TODO 页面点击顶部工具栏的「+ 新建任务」按钮，填写任务信息后保存即可。' },
  { q: '如何切换主题?', a: '点击顶部导航栏右侧的主题图标（🌙/☀️/🍵）即可在亮色、暗色和抹茶主题之间切换。' },
  { q: '如何添加新的工具模块?', a: '在首页点击「管理模式」进入编辑状态，然后点击「添加卡片」选择要添加的模块。' },
  { q: '如何管理文件夹?', a: '在 TODO 页面左侧栏中，点击底部「新建文件夹」创建一级文件夹，或在文件夹上 hover 后点击 + 创建子文件夹。' },
  { q: '记账模块支持哪些功能?', a: '记账模块包含仪表盘、交易记录、账本管理、账户管理、分类管理、标签管理、预算管理和事件管理。' },
];

export default function HelpPage() {
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: 4 }}>
      <Typography variant="h4" sx={{ mb: 1,  fontWeight: 700  }} >帮助</Typography>
      <Typography variant="body2" color="text.secondary"  sx={{ mb: 4 }}>
        查看 ToolWeb 的功能文档和使用指南。
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2,  fontWeight: 600  }} >快速入门</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ToolWeb 是一个多功能工具平台，集成了任务管理、记账、日历等常用工具。
            通过顶部导航栏可以在不同模块之间快速切换。
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2,  fontWeight: 600  }} >常见问题</Typography>
      {FAQS.map((faq, i) => (
        <Accordion key={i} sx={{ mb: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{faq.q}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">{faq.a}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
