/*
 UI Preview Page - 通用组件库目录预览
 仅在 dev 模式下挂载 (import.meta.env.DEV).
 用于快速验证组件 / 主题切换效果, 不暴露生产 bundle.
*/

import React, { useState } from 'react'
import {
  Button,
  IconButton,
  Input,
  Textarea,
  NumberInput,
  Select,
  Combobox,
  Modal,
  Drawer,
  useConfirm,
  useToast,
  Tooltip,
  Popover,
  Tabs,
  Skeleton,
  EmptyState,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Avatar,
  FormField,
} from '../components/ui'

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginBottom: 32 }}>
    <h2 style={{ marginBottom: 12 }}>{title}</h2>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
      {children}
    </div>
  </section>
)

const UIPreviewPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectValue, setSelectValue] = useState<string>('')
  const [comboValue, setComboValue] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | null>(1234.56)
  const [err, setErr] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const selectOpts = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
    { value: 'c', label: 'Cherry' },
  ]
  const comboOpts = [
    { value: 'jp', label: '日本' },
    { value: 'kr', label: '韩国' },
    { value: 'us', label: '美国' },
    { value: 'cn', label: '中国' },
    { value: 'de', label: '德国' },
  ]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>UI Preview</h1>

      <Section title="Button">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="link">Link</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title="IconButton">
        <IconButton aria-label="Edit">✎</IconButton>
        <IconButton aria-label="Delete" variant="danger">🗑</IconButton>
        <IconButton aria-label="Add" variant="primary">+</IconButton>
        <IconButton aria-label="More" variant="secondary">⋯</IconButton>
      </Section>

      <Section title="Inputs">
        <FormField label="Username" hint="Letters and digits">
          <Input placeholder="enter..." />
        </FormField>
        <FormField label="With error" error="Required" required>
          <Input placeholder="empty" invalid />
        </FormField>
        <FormField label="Amount">
          <NumberInput value={amount} onChange={setAmount} prefix="¥" decimals={2} />
        </FormField>
        <FormField label="Notes">
          <Textarea placeholder="multiline..." autosize />
        </FormField>
      </Section>

      <Section title="Select / Combobox">
        <FormField label="Fruit">
          <Select options={selectOpts} value={selectValue} onValueChange={setSelectValue} placeholder="Pick one" />
        </FormField>
        <FormField label="Country">
          <Combobox options={comboOpts} value={comboValue} onChange={setComboValue} placeholder="Search..." />
        </FormField>
      </Section>

      <Section title="Modal / Drawer / Confirm / Toast">
        <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
        <Button variant="danger" onClick={async () => {
          const ok = await confirm({ title: 'Delete item?', description: 'This cannot be undone.', danger: true })
          toast({ message: ok ? 'Deleted' : 'Cancelled', variant: ok ? 'success' : 'info' })
        }}>Confirm</Button>
        <Button variant="ghost" onClick={() => toast({ message: 'Hello world!', variant: 'info' })}>Toast</Button>
        <Button variant="ghost" onClick={() => toast({ message: 'Saved!', variant: 'success' })}>Toast Success</Button>
        <Button variant="ghost" onClick={() => toast({ message: 'Network error', variant: 'error' })}>Toast Error</Button>
      </Section>

      <Section title="Tooltip / Popover">
        <Tooltip content="Hello tooltip">
          <Button variant="secondary">Hover me</Button>
        </Tooltip>
        <Popover trigger={<Button variant="secondary">Open popover</Button>}>
          <div>This is popover content.</div>
        </Popover>
      </Section>

      <Section title="Tabs">
        <Tabs
          items={[
            { value: 'a', label: 'First', content: <div>First panel</div> },
            { value: 'b', label: 'Second', content: <div>Second panel</div> },
            { value: 'c', label: 'Third', content: <div>Third panel</div> },
          ]}
        />
      </Section>

      <Section title="Card">
        <Card variant="elevated">
          <CardHeader><b>Card title</b><Badge variant="accent">new</Badge></CardHeader>
          <CardBody>Lorem ipsum dolor sit amet.</CardBody>
          <CardFooter>
            <Button variant="ghost" size="sm">Cancel</Button>
            <Button size="sm">OK</Button>
          </CardFooter>
        </Card>
        <Card variant="outlined" interactive onClick={() => alert('clicked')}>
          Clickable card
        </Card>
      </Section>

      <Section title="Badge">
        <Badge>neutral</Badge>
        <Badge variant="accent">accent</Badge>
        <Badge variant="success">success</Badge>
        <Badge variant="danger">danger</Badge>
        <Badge variant="warning">warning</Badge>
        <Badge variant="info">info</Badge>
      </Section>

      <Section title="Avatar">
        <Avatar name="Rex Wang" />
        <Avatar name="Alice Lee" size="lg" />
        <Avatar size="sm" />
      </Section>

      <Section title="Spinner / Skeleton / EmptyState">
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" label="Loading data" />
        <div style={{ width: 240 }}>
          <Skeleton variant="text" lines={3} />
        </div>
        <Skeleton variant="circle" width={48} height={48} />
        <EmptyState
          icon="📭"
          title="Nothing here"
          description="Create your first item to get started."
          action={<Button onClick={() => setErr(!err)}>{err ? 'Hide' : 'Create'}</Button>}
        />
      </Section>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Example Modal"
        description="Description goes here"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setModalOpen(false)}>Save</Button>
          </>
        }
      >
        <p>Modal body content. Use Esc / overlay click to close.</p>
      </Modal>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Right Drawer"
        description="Slides in from the side"
        footer={<Button onClick={() => setDrawerOpen(false)}>Close</Button>}
      >
        <p>Drawer body content.</p>
      </Drawer>
    </div>
  )
}

export default UIPreviewPage
