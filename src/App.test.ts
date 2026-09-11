import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'

describe('App', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('switches rules and generates the selected ticket count', async () => {
    const wrapper = mount(App)

    expect(wrapper.text()).toContain('6个红球（1–33）+ 1个蓝球（1–16）')
    await wrapper.find('#tab-dlt').trigger('click')
    expect(wrapper.text()).toContain('5个前区号码（1–35）+ 2个后区号码（1–12）')

    const countButtons = wrapper.findAll('.segmented button')
    await countButtons[1]!.trigger('click')
    await wrapper.get('.generate-button').trigger('click')

    expect(wrapper.findAll('.result-card .ticket-row')).toHaveLength(3)
    expect(wrapper.findAll('.result-card .primary-ball')).toHaveLength(15)
    expect(wrapper.findAll('.result-card .secondary-ball')).toHaveLength(6)
  })

  it('keeps only the latest ten generation batches and clears them', async () => {
    const wrapper = mount(App)

    for (let index = 0; index < 11; index += 1) {
      await wrapper.get('.generate-button').trigger('click')
    }

    expect(wrapper.findAll('.history-item')).toHaveLength(10)
    await wrapper.get('.text-button').trigger('click')
    expect(wrapper.findAll('.history-item')).toHaveLength(0)
    expect(wrapper.text()).toContain('历史记录已清空')
  })

  it('copies the current batch and reports success', async () => {
    const wrapper = mount(App)
    await wrapper.get('.generate-button').trigger('click')
    await wrapper.get('.secondary-button').trigger('click')
    await flushPromises()

    expect(navigator.clipboard.writeText).toHaveBeenCalledOnce()
    expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0]![0]).toMatch(
      /^双色球\n(?:\d{2}, ){5}\d{2} \+ \d{2}$/,
    )
    expect(wrapper.text()).toContain('号码已复制')
  })

  it('reports a clipboard failure', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'))
    const wrapper = mount(App)
    await wrapper.get('.generate-button').trigger('click')
    await wrapper.get('.secondary-button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('复制失败，请稍后重试')
  })
})
