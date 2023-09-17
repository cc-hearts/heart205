import { findPasswordDetail, searchPassword } from '@/model/password'
import { useDescription } from '@/storage/description'
import { GetPromiseReturns } from '@/types/utils'

import {
  Button,
  Dropdown,
  Input,
  Menu,
  MenuItem,
  message,
} from 'ant-design-vue'
import { DownOutlined, EditOutlined } from '@ant-design/icons-vue'
import { defineComponent, reactive, ref, watch } from 'vue'
import { decodeAes } from '@/utils/crypto'
import AddPasswordModal from './AddPasswordModal'
import * as electron from 'electron'
import { fn } from '@cc-heart/utils/helper'
import { useOpenLink } from '@/hooks/useOpenLink'
const { clipboard } = electron

export default defineComponent({
  name: 'passwordDescription',
  setup() {
    const columns = [
      { label: 'username', key: 'username' },
      { label: 'password', key: 'password' },
    ] as const

    const otherColumns = [
      { label: 'website', key: 'url' },
      { label: 'description', key: 'description' },
    ] as const

    const passwordModelProps = reactive({
      visible: false,
    })
    const passwordModalRef = ref<{ setFieldsValue: fn } | null>(null)
    const reviewPasswordStatus = ref(false)

    const { activeDescription } = useDescription()

    const description = reactive({
      data: {} as GetPromiseReturns<typeof findPasswordDetail>,
      password: '',
    })

    const toggleReviewPasswordStatus = () => {
      reviewPasswordStatus.value = !reviewPasswordStatus.value
    }
    async function getData() {
      handleRemovePassword()
      const id = Number(activeDescription.value)
      if (id) {
        const data = await findPasswordDetail(id)
        if (data) {
          description.data = data
          handleSearchPassword(description.data.id!)
          Reflect.set(
            data,
            'createdAt',
            new Date(data.createdAt).toLocaleString()
          )
          Reflect.set(
            data,
            'updatedAt',
            new Date(data.updatedAt).toLocaleString()
          )
        }
      }
    }

    async function handleSearchPassword(id: number) {
      const result = await searchPassword(id)
      if (result && result.password) {
        const code = await decodeAes(result.password)
        if (code) description.password = code
      }
    }

    function handleRemovePassword() {
      description.password = ''
      reviewPasswordStatus.value = false
    }

    watch(
      () => activeDescription.value,
      () => {
        getData()
      }
    )

    const handleCopyPassword = async (key: string) => {
      if (key === 'password') {
        const pwd = description.password
        if (!pwd) {
          await handleSearchPassword(description.data!.id)
        }
        clipboard.writeText(description.password)
        message.success('🎉 copy password to clipboard success')
        description.password = pwd
      }
    }

    const handleEditPasswordDescription = () => {
      passwordModelProps.visible = true
      passwordModalRef &&
        passwordModalRef.value?.setFieldsValue({
          ...description.data,
          password: description.password,
        })
    }
    const handleCancelPasswordModal = () => {
      passwordModelProps.visible = false
    }

    const handleMenuClick = ({ key }: { key: string }) => {
      switch (key) {
        case 'toggle':
          toggleReviewPasswordStatus()
          if (reviewPasswordStatus.value)
            handleSearchPassword(description.data!.id)
          break
        case 'copy':
          handleCopyPassword('password')
          break
      }
    }

    const formatDescription = (field: string, key: string) => {
      if (key === 'password')
        return (
          <Input
            style={{ padding: 0 }}
            type={reviewPasswordStatus.value ? 'default' : 'password'}
            bordered={false}
            value={description.password}
          />
        )
      return field
    }

    const formatOtherDescription = (description: string, key: string) => {
      if (key === 'url')
        return (
          <Button
            style={{ padding: 0 }}
            type="link"
            onClick={() => useOpenLink(description)}
          >
            {description}
          </Button>
        )
      return description
    }
    return () => {
      if (!activeDescription.value) return null
      return (
        <div>
          <div class="flex m-t-4 justify-between">
            <div></div>
            <div>
              <Button
                icon={<EditOutlined />}
                type="link"
                onClick={handleEditPasswordDescription}
              >
                Edit
              </Button>
            </div>
          </div>
          <div class="m-6 leading-5">
            <h3>{Reflect.get(description.data!, 'title')}</h3>
            <div class={'border-ins border-solid border-1px rounded m-y-6'}>
              {columns.map((column, index) => {
                const key = column.key as (typeof columns)[number]['key']
                const isPasswordField = key === 'password'
                const isLastIndex = index === columns.length - 1
                return (
                  <div
                    key={key}
                    class={
                      (isLastIndex
                        ? ''
                        : 'border-b-1px border-b-solid border-b-ins ') + 'p-3'
                    }
                  >
                    <div
                      class={
                        isPasswordField
                          ? 'flex items-center justify-between	'
                          : ''
                      }
                    >
                      <span>{column.label}</span>
                      {isPasswordField && (
                        <Dropdown>
                          {{
                            overlay: () => (
                              <Menu onClick={handleMenuClick}>
                                <MenuItem key="toggle">
                                  {reviewPasswordStatus.value
                                    ? 'hidden'
                                    : 'view'}
                                </MenuItem>
                                <MenuItem key="copy">copy</MenuItem>
                              </Menu>
                            ),
                            default: () => (
                              <Button type="link">
                                Actions
                                <DownOutlined />
                              </Button>
                            ),
                          }}
                        </Dropdown>
                      )}
                    </div>
                    <div>
                      {formatDescription(
                        Reflect.get(description.data!, key),
                        key
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div class="m-6 leading-5">
            {otherColumns.map((column) => {
              const key = column.key as (typeof columns)[number]['key']
              return (
                <div key={key} class="m-y-3">
                  <div>{column.label}</div>
                  <div>
                    {formatOtherDescription(
                      Reflect.get(description.data!, key),
                      key
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div class="m-t-20 flex text-sm	text-slate-400 flex-col items-center justify-center">
            {description.data?.createdAt && (
              <div>created: {description.data.createdAt}</div>
            )}
            {description.data?.updatedAt && (
              <div>modified: {description.data.updatedAt}</div>
            )}
          </div>
          <AddPasswordModal
            ref={passwordModalRef}
            id={description.data!.id}
            status="edit"
            onRefresh={getData}
            onCancel={handleCancelPasswordModal}
            visible={passwordModelProps.visible}
          />
        </div>
      )
    }
  },
})
