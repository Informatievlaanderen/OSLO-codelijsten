import { mount } from '@vue/test-utils'
import Page from "./index.vue"

describe("Index page", () => {
    const wrapper = mount(Page);
    test('Does the wrapper exist', () => {
        expect(wrapper.exists()).toBe(true)
    })
})